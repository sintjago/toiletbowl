import { createScene } from "./scene.js";
import { applyToiletPose, createToilet } from "./toilet3d.js";

function mountScene(root, { angleId, flush, background, segments, material }) {
  const parts = createToilet({ segments, material });
  const { scene, dispose } = createScene(root, {
    angleId,
    background,
    flush,
    onFrame: (now) => applyToiletPose(parts, flush.sample(now)),
  });
  scene.add(parts.group);
  return dispose;
}

export function mountPorcelain(root, opts) {
  return mountScene(root, { ...opts, segments: 48, material: "porcelain" });
}

export function mountWireframe(root, opts) {
  return mountScene(root, {
    ...opts,
    background: "#f4efe4",
    segments: 18,
    material: "wire",
  });
}

export function mountLowpoly(root, opts) {
  return mountScene(root, { ...opts, segments: 8, material: "porcelain" });
}
