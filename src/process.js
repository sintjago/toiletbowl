const ASCII = " .'`^\",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

function luminance(r, g, b) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

const samplePool = new Map();

function sample(source, cols, rows) {
  const key = `${cols}x${rows}`;
  let canvas = samplePool.get(key);
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.width = cols;
    canvas.height = rows;
    samplePool.set(key, canvas);
  }
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(source, 0, 0, cols, rows);
  return { canvas, ctx, data: ctx.getImageData(0, 0, cols, rows) };
}

function put(src, out) {
  src.ctx.putImageData(out, 0, 0);
  return src.canvas;
}

export function applyFilter(source, name) {
  if (!name || name === "ascii") return source;
  if (name === "pixel") {
    const small = sample(source, 48, 48);
    return small.canvas;
  }

  const src = sample(source, 220, 220);
  const out = src.ctx.createImageData(src.data.width, src.data.height);
  if (name === "dither") dither(src.data, out);
  else if (name === "gameboy") gameboy(src.data, out);
  else if (name === "posterize") posterize(src.data, out);
  else if (name === "edges") edges(src.data, out);
  else if (name === "duotone") duotone(src.data, out);
  else if (name === "crt") crt(src.data, out);
  else return source;
  return put(src, out);
}

export function canvasToAscii(source) {
  const cols = 86;
  const rows = Math.max(28, Math.round((cols * source.height) / source.width / 1.85));
  const { data } = sample(source, cols, rows);
  let text = "";
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const i = (y * cols + x) * 4;
      const lum = luminance(data.data[i], data.data[i + 1], data.data[i + 2]);
      text += ASCII[Math.min(ASCII.length - 1, Math.floor(lum * ASCII.length))];
    }
    text += "\n";
  }
  return text;
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

export function scanlines(ctx, box) {
  ctx.fillStyle = "rgba(12, 28, 26, 0.18)";
  for (let y = box.y; y < box.y + box.h; y += 3) {
    ctx.fillRect(box.x, y, box.w, 1);
  }
}
