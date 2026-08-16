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

function coverOval(ctx, box, part, extra = 1) {
  ctx.beginPath();
  ctx.ellipse(
    box.x + part.cx * box.w,
    box.y + part.cy * box.h,
    part.rx * box.w * extra,
    part.ry * box.h * extra,
    part.tilt,
    0,
    Math.PI * 2,
  );
}

function hingedPart(box, part, amount) {
  const t = amount;
  const [hx, hy] = px(box, part.hingeX, part.hingeY);
  const [cx, cy] = px(box, part.cx, part.cy);
  return {
    x: cx + (hx - cx) * t * 0.82 - t * 0.03 * box.w,
    y: cy + (hy - cy) * t * 0.82 - t * 0.14 * box.h,
    rx: part.rx * box.w * (1 - 0.12 * t),
    ry: Math.max(3, part.ry * box.h * (1 - 0.84 * t)),
    tilt: part.tilt - t * 0.45,
    edge: t > 0.82,
  };
}

function drawFlush(ctx, img, box, pose, rig) {
  ctx.save();
  ctx.translate(pose.shake * 1.4, pose.shake * 0.35);
  ctx.drawImage(img, box.x, box.y, box.w, box.h);

  const lidAmt = pose.lid || 0;
  const seatAmt = pose.seat || 0;
  if (pose.handle < 0.01 && lidAmt < 0.01 && seatAmt < 0.01) {
    ctx.restore();
    return;
  }

  const porcelain = sampleColor(img, 0.5, 0.36);
  const shade = sampleColor(img, 0.44, 0.42);

  if (lidAmt > 0.02 || seatAmt > 0.02) {
    coverOval(ctx, box, rig.lid, 1.08);
    ctx.fillStyle = porcelain;
    ctx.fill();

    const bowl = rig.bowl;
    const [bx, by] = px(box, bowl.cx, bowl.cy);
    const brx = bowl.rx * box.w;
    const bry = bowl.ry * box.h;

    ctx.beginPath();
    ctx.ellipse(bx, by, brx * 1.18, bry * 1.2, bowl.tilt, 0, Math.PI * 2);
    ctx.fillStyle = shade;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(bx, by, brx, bry, bowl.tilt, 0, Math.PI * 2);
    ctx.fillStyle = "#245864";
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(bx, by, brx * 0.92, bry * 0.92, bowl.tilt, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(46, 140, 168, ${0.5 + pose.level * 0.4})`;
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(
      bx,
      by,
      brx * (0.35 + pose.level * 0.6),
      bry * (0.35 + pose.level * 0.6),
      bowl.tilt,
      0,
      Math.PI * 2,
    );
    ctx.clip();
    ctx.strokeStyle = "rgba(255,255,255,0.82)";
    ctx.lineWidth = 4;
    for (let i = 0; i < 8; i += 1) {
      const a = pose.swirl + i * 0.62;
      ctx.beginPath();
      ctx.ellipse(
        bx + Math.cos(a) * brx * 0.18,
        by + Math.sin(a) * bry * 0.18,
        brx * (0.74 - i * 0.07),
        bry * (0.74 - i * 0.07),
        a,
        0,
        Math.PI * 1.5,
      );
      ctx.stroke();
    }
    ctx.restore();

    if (seatAmt > 0.02) {
      const seat = hingedPart(box, rig.seat, seatAmt);
      ctx.beginPath();
      ctx.ellipse(seat.x, seat.y, seat.rx, seat.ry, seat.tilt, 0, Math.PI * 2);
      ctx.fillStyle = porcelain;
      ctx.fill();
      if (!seat.edge) {
        ctx.beginPath();
        ctx.ellipse(seat.x, seat.y, seat.rx * 0.62, seat.ry * 0.55, seat.tilt, 0, Math.PI * 2);
        ctx.fillStyle = "#1f4d56";
        ctx.fill();
      }
    }

    if (lidAmt > 0.02) {
      const lid = hingedPart(box, rig.lid, lidAmt);
      ctx.beginPath();
      ctx.ellipse(lid.x, lid.y, lid.rx, lid.ry, lid.tilt, 0, Math.PI * 2);
      ctx.fillStyle = porcelain;
      ctx.fill();
      ctx.strokeStyle = "rgba(22, 51, 47, 0.28)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
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
    paint(flush.sample(now));
    frame = requestAnimationFrame(tick);
  };

  const ready = (async () => {
    img = src ? await loadImage(src) : await loadPhoto(angleId);
    paint(flush.sample());
    if (!frame) frame = requestAnimationFrame(tick);
  })();

  const onClick = () => flush.start();
  canvas.addEventListener("click", onClick);
  ascii?.addEventListener("click", onClick);
  const stopListen = flush.onStart(() => {});
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
