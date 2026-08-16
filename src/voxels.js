import * as THREE from "three";
import { createScene } from "./scene.js";

const EMPTY = 0;
const PORCELAIN = 1;
const SHADE = 2;
const CHROME = 3;
const TILE = 4;

const COLORS = {
  [PORCELAIN]: 0xfffdf8,
  [SHADE]: 0xd9d2c4,
  [CHROME]: 0xc9d4d1,
  [TILE]: 0x8fb8ae,
};

function box(voxels, x0, y0, z0, x1, y1, z1, kind) {
  for (let y = y0; y <= y1; y += 1) {
    for (let z = z0; z <= z1; z += 1) {
      for (let x = x0; x <= x1; x += 1) {
        voxels[y][z][x] = kind;
      }
    }
  }
}

function oval(voxels, cx, y, cz, rx, rz, kind) {
  for (let z = cz - rz; z <= cz + rz; z += 1) {
    for (let x = cx - rx; x <= cx + rx; x += 1) {
      const dx = (x - cx) / rx;
      const dz = (z - cz) / rz;
      if (dx * dx + dz * dz <= 1.05) voxels[y][z][x] = kind;
    }
  }
}

function buildToilet() {
  const w = 15;
  const h = 14;
  const d = 16;
  const voxels = Array.from({ length: h }, () =>
    Array.from({ length: d }, () => Array.from({ length: w }, () => EMPTY)),
  );

  box(voxels, 0, 0, 0, w - 1, 0, d - 1, TILE);
  box(voxels, 0, 1, 0, w - 1, h - 1, 0, TILE);
  box(voxels, 4, 1, 5, 10, 3, 11, PORCELAIN);
  oval(voxels, 7, 4, 8, 5, 4, PORCELAIN);
  oval(voxels, 7, 5, 8, 5, 4, SHADE);
  oval(voxels, 7, 6, 8, 5, 4, PORCELAIN);
  box(voxels, 3, 7, 1, 11, 12, 3, PORCELAIN);
  box(voxels, 3, 12, 1, 11, 12, 3, SHADE);
  voxels[11][3][4] = CHROME;
  voxels[11][4][4] = CHROME;
  voxels[11][4][3] = CHROME;

  return { voxels, w, h, d };
}

export function mountVoxels(root, { angleId }) {
  const { scene, dispose } = createScene(root, { angleId });
  const { voxels, w, h, d } = buildToilet();
  const group = new THREE.Group();
  const size = 0.2;
  const geo = new THREE.BoxGeometry(size * 0.94, size * 0.94, size * 0.94);

  for (let y = 0; y < h; y += 1) {
    for (let z = 0; z < d; z += 1) {
      for (let x = 0; x < w; x += 1) {
        const kind = voxels[y][z][x];
        if (!kind) continue;
        const mesh = new THREE.Mesh(
          geo,
          new THREE.MeshStandardMaterial({
            color: COLORS[kind],
            roughness: 0.35,
            metalness: kind === CHROME ? 0.8 : 0.04,
          }),
        );
        mesh.position.set(
          (x - (w - 1) / 2) * size,
          y * size + 0.1,
          (z - (d - 1) / 2) * size,
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
      }
    }
  }

  scene.add(group);
  return dispose;
}
