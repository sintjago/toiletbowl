import { createScene } from "./scene.js";
import { createToilet } from "./toilet3d.js";

export function mountPorcelain(root, { angleId }) {
  const { scene, dispose } = createScene(root, { angleId });
  scene.add(createToilet({ segments: 48, material: "porcelain" }));
  return dispose;
}

export function mountWireframe(root, { angleId }) {
  const { scene, dispose } = createScene(root, {
    angleId,
    background: "#f4efe4",
  });
  scene.add(createToilet({ segments: 18, material: "wire" }));
  return dispose;
}

export function mountLowpoly(root, { angleId }) {
  const { scene, dispose } = createScene(root, { angleId });
  scene.add(createToilet({ segments: 8, material: "porcelain" }));
  return dispose;
}
