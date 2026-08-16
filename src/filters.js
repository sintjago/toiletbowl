import { contain, loadPhoto, sampleImage } from "./photo.js";

const ASCII = " .'`^\",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

function luminance(r, g, b) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function mountCanvas(root, draw) {
  const panel = document.createElement("div");
  panel.className = "panel";
  const canvas = document.createElement("canvas");
  canvas.className = "pixel-canvas";
  panel.append(canvas);
  root.append(panel);
  const ctx = canvas.getContext("2d");
  const redraw = () => draw(panel, canvas, ctx);
  redraw();
  const observer = new ResizeObserver(redraw);
  observer.observe(panel);
  return () => {
    observer.disconnect();
    panel.remove();
  };
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

export function mountFilter(root, { angleId, style }) {
  const name = style.filter;
  if (name === "ascii") return mountAscii(root, angleId);
  return mountCanvas(root, async (panel, canvas, ctx) => {
    const img = await loadPhoto(angleId);
    const { width, height } = prepare(panel, canvas, ctx);
    const box = contain(img, width, height, 28);
    if (name === "pixel") {
      paintPixel(ctx, img, box);
      return;
    }
    const src = sampleImage(img, 220, 220);
    const out = ctx.createImageData(src.width, src.height);
    if (name === "dither") dither(src, out);
    if (name === "gameboy") gameboy(src, out);
    if (name === "posterize") posterize(src, out);
    if (name === "edges") edges(src, out);
    if (name === "duotone") duotone(src, out);
    if (name === "crt") crt(src, out);
    const work = document.createElement("canvas");
    work.width = src.width;
    work.height = src.height;
    work.getContext("2d").putImageData(out, 0, 0);
    ctx.imageSmoothingEnabled = name !== "dither" && name !== "gameboy";
    ctx.drawImage(work, box.x, box.y, box.w, box.h);
    if (name === "crt") scanlines(ctx, box);
  });
}

function paintPixel(ctx, img, box) {
  const cols = 48;
  const rows = 48;
  const work = document.createElement("canvas");
  work.width = cols;
  work.height = rows;
  const wctx = work.getContext("2d");
  wctx.imageSmoothingEnabled = true;
  wctx.drawImage(img, 0, 0, cols, rows);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(work, box.x, box.y, box.w, box.h);
}

function dither(src, out) {
  const bayer = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];
  for (let y = 0; y < src.height; y += 1) {
    for (let x = 0; x < src.width; x += 1) {
      const i = (y * src.width + x) * 4;
      const lum = luminance(src.data[i], src.data[i + 1], src.data[i + 2]);
      const threshold = (bayer[y % 4][x % 4] + 0.5) / 16;
      const v = lum > threshold ? 247 : 28;
      out.data[i] = v;
      out.data[i + 1] = v;
      out.data[i + 2] = v;
      out.data[i + 3] = 255;
    }
  }
}

function gameboy(src, out) {
  const palette = [
    [15, 56, 15],
    [48, 98, 48],
    [139, 172, 15],
    [155, 188, 15],
  ];
  for (let i = 0; i < src.data.length; i += 4) {
    const lum = luminance(src.data[i], src.data[i + 1], src.data[i + 2]);
    const swatch = palette[Math.min(3, Math.floor(lum * 4))];
    out.data[i] = swatch[0];
    out.data[i + 1] = swatch[1];
    out.data[i + 2] = swatch[2];
    out.data[i + 3] = 255;
  }
}

function posterize(src, out) {
  const steps = 4;
  for (let i = 0; i < src.data.length; i += 4) {
    for (let c = 0; c < 3; c += 1) {
      const value = src.data[i + c] / 255;
      out.data[i + c] = clampByte((Math.round(value * (steps - 1)) / (steps - 1)) * 255);
    }
    out.data[i + 3] = 255;
  }
}

function edges(src, out) {
  const w = src.width;
  const h = src.height;
  out.data.fill(255);
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      let gx = 0;
      let gy = 0;
      for (let ky = -1; ky <= 1; ky += 1) {
        for (let kx = -1; kx <= 1; kx += 1) {
          const i = ((y + ky) * w + (x + kx)) * 4;
          const lum = luminance(src.data[i], src.data[i + 1], src.data[i + 2]);
          gx += lum * kx;
          gy += lum * ky;
        }
      }
      const mag = Math.min(1, Math.hypot(gx, gy) * 1.8);
      const v = clampByte(255 - mag * 255);
      const o = (y * w + x) * 4;
      out.data[o] = v;
      out.data[o + 1] = v;
      out.data[o + 2] = v;
      out.data[o + 3] = 255;
    }
  }
}

function duotone(src, out) {
  const shadow = [22, 51, 47];
  const light = [247, 243, 234];
  for (let i = 0; i < src.data.length; i += 4) {
    const t = luminance(src.data[i], src.data[i + 1], src.data[i + 2]);
    out.data[i] = clampByte(shadow[0] + (light[0] - shadow[0]) * t);
    out.data[i + 1] = clampByte(shadow[1] + (light[1] - shadow[1]) * t);
    out.data[i + 2] = clampByte(shadow[2] + (light[2] - shadow[2]) * t);
    out.data[i + 3] = 255;
  }
}

function crt(src, out) {
  for (let y = 0; y < src.height; y += 1) {
    for (let x = 0; x < src.width; x += 1) {
      const i = (y * src.width + x) * 4;
      const shift = x + 1 < src.width ? 4 : 0;
      out.data[i] = src.data[i + shift];
      out.data[i + 1] = src.data[i + 1];
      out.data[i + 2] = src.data[i + (x > 0 ? -2 : 2)];
      out.data[i + 3] = 255;
    }
  }
}

function scanlines(ctx, box) {
  ctx.fillStyle = "rgba(12, 28, 26, 0.18)";
  for (let y = box.y; y < box.y + box.h; y += 3) {
    ctx.fillRect(box.x, y, box.w, 1);
  }
}

function mountAscii(root, angleId) {
  const panel = document.createElement("div");
  panel.className = "panel";
  const wrap = document.createElement("div");
  wrap.className = "ascii-wrap";
  const pre = document.createElement("pre");
  pre.className = "ascii-art ascii-photo";
  wrap.append(pre);
  panel.append(wrap);
  root.append(panel);

  const draw = async () => {
    const img = await loadPhoto(angleId);
    const cols = 86;
    const rows = Math.max(28, Math.round((cols * img.naturalHeight) / img.naturalWidth / 1.85));
    const data = sampleImage(img, cols, rows);
    let text = "";
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const i = (y * cols + x) * 4;
        const lum = luminance(data.data[i], data.data[i + 1], data.data[i + 2]);
        text += ASCII[Math.min(ASCII.length - 1, Math.floor(lum * ASCII.length))];
      }
      text += "\n";
    }
    pre.textContent = text;
  };

  draw();
  const observer = new ResizeObserver(() => {});
  observer.observe(panel);
  return () => {
    observer.disconnect();
    panel.remove();
  };
}
