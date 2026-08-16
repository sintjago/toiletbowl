import { contain, loadPhoto } from "./photo.js";
import { applyFilter, canvasToAscii, scanlines } from "./process.js";
import { rigFor } from "./rig.js";

const imageCache = new Map();
const work = document.createElement("canvas");
work.width = 640;
work.height = 640;
const workCtx = work.getContext("2d");

function loadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const pending = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Missing ${src}`));
    img.src = src;
  });
  imageCache.set(src, pending);
  return pending;
}

function prepare(panel, canvas, ctx) {
  const dpr = window.devicePixelRatio || 1;
  const width = panel.clientWidth;
  const height = panel.clientHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#eef6f3";
  ctx.fillRect(0, 0, width, height);
  return { width, height };
}

function px(box, u, v) {
  return [box.x + u * box.w, box.y + v * box.h];
}

function sampleColor(img, u, v) {
  const probe = sampleColor.canvas || (sampleColor.canvas = document.createElement("canvas"));
  probe.width = 1;
  probe.height = 1;
  const ctx = probe.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(
    img,
    Math.max(0, Math.floor(u * img.naturalWidth)),
    Math.max(0, Math.floor(v * img.naturalHeight)),
    1,
    1,
    0,
    0,
    1,
    1,
  );
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}

function drawFlush(ctx, img, box, pose, rig) {
  ctx.save();
  ctx.translate(pose.shake, 0);
  ctx.drawImage(img, box.x, box.y, box.w, box.h);

  if (pose.handle < 0.01 && pose.lid < 0.01) {
    ctx.restore();
    return;
  }

  const bowl = rig.bowl;
  const [bx, by] = px(box, bowl.cx, bowl.cy);
  const brx = bowl.rx * box.w;
  const bry = bowl.ry * box.h;

  if (pose.lid > 0.02) {
    ctx.beginPath();
    ctx.ellipse(bx, by, brx * 1.18, bry * 1.22, bowl.tilt, 0, Math.PI * 2);
    ctx.fillStyle = sampleColor(img, 0.46, 0.44);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(bx, by, brx, bry, bowl.tilt, 0, Math.PI * 2);
    ctx.fillStyle = "#4d7d8c";
    ctx.globalAlpha = 0.55 + pose.level * 0.25;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(bx, by, brx * pose.level, bry * pose.level, bowl.tilt, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 7; i += 1) {
      const a = pose.swirl + i * 0.7;
      ctx.beginPath();
      ctx.ellipse(
        bx + Math.cos(a) * brx * 0.18,
        by + Math.sin(a) * bry * 0.18,
        brx * (0.72 - i * 0.08),
        bry * (0.72 - i * 0.08),
        a,
        0,
        Math.PI * 1.4,
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  if (pose.lid > 0.02) {
    const lid = rig.lid;
    const [hx, hy] = px(box, lid.hingeX, lid.hingeY);
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(-pose.lid * 2.05);
    ctx.translate(-hx, -hy);
    ctx.beginPath();
    ctx.ellipse(
      box.x + lid.cx * box.w,
      box.y + lid.cy * box.h,
      lid.rx * box.w,
      lid.ry * box.h,
      lid.tilt,
      0,
      Math.PI * 2,
    );
    ctx.clip();
    ctx.drawImage(img, box.x, box.y, box.w, box.h);
    ctx.restore();
  }

  if (pose.handle > 0.01) {
    const handle = rig.handle;
    const [cx, cy] = px(box, handle.cx, handle.cy);
    const [pivotX, pivotY] = px(box, handle.pivotX, handle.pivotY);
    ctx.beginPath();
    ctx.ellipse(cx, cy, handle.rx * box.w * 1.2, handle.ry * box.h * 1.6, handle.tilt, 0, Math.PI * 2);
    ctx.fillStyle = sampleColor(img, handle.pivotX, handle.pivotY);
    ctx.fill();

    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate(pose.handle * 0.9);
    ctx.translate(-pivotX, -pivotY);
    ctx.beginPath();
    ctx.ellipse(cx, cy, handle.rx * box.w, handle.ry * box.h, handle.tilt, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, box.x, box.y, box.w, box.h);
    ctx.restore();
  }

  ctx.restore();
}

export function mountPicture(root, { src, filter, flush, angleId }) {
  const panel = document.createElement("div");
  panel.className = "panel";
  const canvas = document.createElement("canvas");
  canvas.className = "pixel-canvas flush-canvas";
  canvas.title = "Click to flush";
  panel.append(canvas);
  root.append(panel);

  const ascii = filter === "ascii" ? document.createElement("pre") : null;
  if (ascii) {
    ascii.className = "ascii-art ascii-photo ascii-flush";
    const wrap = document.createElement("div");
    wrap.className = "ascii-wrap";
    wrap.append(ascii);
    panel.append(wrap);
    canvas.style.display = "none";
  }

  const ctx = canvas.getContext("2d");
  const rig = rigFor(angleId);
  let img = null;
  let frame = 0;

  const paint = (pose) => {
    if (!img) return;
    const size = prepare(panel, canvas, ctx);
    const box = contain(img, size.width, size.height, 28);
    const sourceBox = { x: 0, y: 0, w: work.width, h: work.height };
    workCtx.fillStyle = "#eef6f3";
    workCtx.fillRect(0, 0, work.width, work.height);
    drawFlush(workCtx, img, sourceBox, pose, rig);
    const processed = applyFilter(work, filter);
    ctx.imageSmoothingEnabled = filter !== "pixel" && filter !== "dither" && filter !== "gameboy";
    ctx.drawImage(processed, box.x, box.y, box.w, box.h);
    if (filter === "crt") scanlines(ctx, box);
    if (ascii) ascii.textContent = canvasToAscii(work);
  };

  const tick = (now) => {
    const pose = flush.sample(now);
    paint(pose);
    frame = pose.active ? requestAnimationFrame(tick) : 0;
  };

  const kick = () => {
    if (!frame) frame = requestAnimationFrame(tick);
  };

  const ready = (async () => {
    img = src ? await loadImage(src) : await loadPhoto(angleId);
    paint(flush.sample());
  })();

  const onClick = () => flush.start();
  canvas.addEventListener("click", onClick);
  ascii?.addEventListener("click", onClick);
  const stopListen = flush.onStart(kick);
  const observer = new ResizeObserver(() => {
    if (img) paint(flush.sample());
  });
  observer.observe(panel);

  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    stopListen();
    canvas.removeEventListener("click", onClick);
    ready.catch(() => {});
    panel.remove();
  };
}
