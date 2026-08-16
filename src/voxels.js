import * as THREE from "three";
import { createScene } from "./scene.js";

const EMPTY = 0;
const PORCELAIN = 1;
const SHADE = 2;
const WATER = 3;
const CHROME = 4;
const TILE = 5;

const COLORS = {
  [PORCELAIN]: 0xfffdf8,
  [SHADE]: 0xd9d2c4,
  [WATER]: 0x7aa8b8,
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

function ring(voxels, cx, y, cz, outer, inner, kind, shadeKind = SHADE) {
  for (let z = cz - outer; z <= cz + outer; z += 1) {
    for (let x = cx - outer; x <= cx + outer; x += 1) {
      const dx = x - cx;
      const dz = z - cz;
      const d = Math.hypot(dx, dz);
      if (d <= outer + 0.35 && d >= inner - 0.15) {
        voxels[y][z][x] = d > outer - 0.4 ? shadeKind : kind;
      }
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
  box(voxels, 4, 1, 4, 10, 2, 10, PORCELAIN);
  box(voxels, 3, 3, 3, 11, 4, 11, PORCELAIN);
  ring(voxels, 7, 5, 7, 5, 2, PORCELAIN);
  ring(voxels, 7, 6, 7, 5, 2, PORCELAIN);
  box(voxels, 6, 4, 6, 8, 4, 8, WATER);
  box(voxels, 6, 5, 6, 8, 5, 8, WATER);
  box(voxels, 3, 7, 1, 11, 12, 3, PORCELAIN);
  box(voxels, 4, 12, 1, 10, 12, 3, SHADE);
  box(voxels, 3, 7, 1, 11, 7, 3, SHADE);
  voxels[11][4][11] = CHROME;
  voxels[11][4][12] = CHROME;
  voxels[11][4][13] = CHROME;

  return { voxels, w, h, d };
}

export function mountVoxels(root) {
  const { scene, dispose } = createScene(root, { cameraZ: 7.2, cameraY: 2.4 });
  const { voxels, w, h, d } = buildToilet();
  const group = new THREE.Group();
  const size = 0.22;
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
            roughness: kind === WATER ? 0.12 : 0.35,
            metalness: kind === CHROME ? 0.8 : 0.04,
          }),
        );
        mesh.position.set(
          (x - (w - 1) / 2) * size,
          y * size + 0.12,
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
