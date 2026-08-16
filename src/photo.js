const cache = new Map();

export function loadPhoto(angleId) {
  const src = `./toilets/${angleId}/photo.png`;
  if (cache.has(src)) return cache.get(src);
  const pending = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Missing canonical photo for ${angleId}`));
    img.src = src;
  });
  cache.set(src, pending);
  return pending;
}

export function contain(img, boxW, boxH, pad = 0) {
  const maxW = Math.max(boxW - pad * 2, 1);
  const maxH = Math.max(boxH - pad * 2, 1);
  const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  return {
    x: (boxW - w) / 2,
    y: (boxH - h) / 2,
    w,
    h,
  };
}

export function sampleImage(img, cols, rows) {
  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, 0, 0, cols, rows);
  return ctx.getImageData(0, 0, cols, rows);
}
