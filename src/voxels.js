import * as THREE from "three";
import { createScene } from "./scene.js";

const EMPTY = 0;
const PORCELAIN = 1;
const SHADE = 2;
const CHROME = 3;
const TILE = 4;
const WATER = 5;
const LID = 6;
const SEAT = 7;

const COLORS = {
  [PORCELAIN]: 0xfffdf8,
  [SHADE]: 0xd9d2c4,
  [CHROME]: 0xc9d4d1,
  [TILE]: 0x8fb8ae,
  [WATER]: 0x4d7d8c,
  [LID]: 0xfffdf8,
  [SEAT]: 0xf0ebe0,
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

function ring(voxels, cx, y, cz, rx, rz, inner, kind) {
  for (let z = cz - rz; z <= cz + rz; z += 1) {
    for (let x = cx - rx; x <= cx + rx; x += 1) {
      const dx = (x - cx) / rx;
      const dz = (z - cz) / rz;
      const d = dx * dx + dz * dz;
      if (d <= 1.05 && d >= inner * inner) voxels[y][z][x] = kind;
    }
  }
}

function oval(voxels, cx, y, cz, rx, rz, kind) {
  ring(voxels, cx, y, cz, rx, rz, 0, kind);
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
  ring(voxels, 7, 4, 8, 5, 4, 0.35, PORCELAIN);
  ring(voxels, 7, 5, 8, 5, 4, 0.42, SEAT);
  oval(voxels, 7, 6, 8, 5, 4, LID);
  box(voxels, 6, 4, 7, 8, 4, 9, WATER);
  box(voxels, 3, 7, 1, 11, 12, 3, PORCELAIN);
  box(voxels, 3, 12, 1, 11, 12, 3, SHADE);
  voxels[11][3][4] = CHROME;
  voxels[11][4][4] = CHROME;
  voxels[11][4][3] = CHROME;

  return { voxels, w, h, d };
}

export function mountVoxels(root, { angleId, flush }) {
  const { voxels, w, h, d } = buildToilet();
  const group = new THREE.Group();
  const lidPivot = new THREE.Group();
  const seatPivot = new THREE.Group();
  const handlePivot = new THREE.Group();
  const waterGroup = new THREE.Group();
  const size = 0.2;
  const geo = new THREE.BoxGeometry(size * 0.94, size * 0.94, size * 0.94);
  const backZ = (4 - (d - 1) / 2) * size;
  const lidAnchor = new THREE.Vector3(0, 6 * size + 0.1, backZ);
  const seatAnchor = new THREE.Vector3(0, 5 * size + 0.1, backZ);
  const handleAnchor = new THREE.Vector3(
    (5 - (w - 1) / 2) * size,
    11 * size + 0.1,
    (3.5 - (d - 1) / 2) * size,
  );
  const waterAnchor = new THREE.Vector3(0, 4 * size + 0.1, (8 - (d - 1) / 2) * size);

  lidPivot.position.copy(lidAnchor);
  seatPivot.position.copy(seatAnchor);
  handlePivot.position.copy(handleAnchor);
  waterGroup.position.copy(waterAnchor);
  group.add(lidPivot, seatPivot, handlePivot, waterGroup);

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
            transparent: kind === WATER,
            opacity: kind === WATER ? 0.8 : 1,
          }),
        );
        const world = new THREE.Vector3(
          (x - (w - 1) / 2) * size,
          y * size + 0.1,
          (z - (d - 1) / 2) * size,
        );
        if (kind === LID) {
          mesh.position.copy(world.clone().sub(lidAnchor));
          lidPivot.add(mesh);
        } else if (kind === SEAT) {
          mesh.position.copy(world.clone().sub(seatAnchor));
          seatPivot.add(mesh);
        } else if (kind === CHROME) {
          mesh.position.copy(world.clone().sub(handleAnchor));
          handlePivot.add(mesh);
        } else if (kind === WATER) {
          mesh.position.copy(world.clone().sub(waterAnchor));
          waterGroup.add(mesh);
        } else {
          mesh.position.copy(world);
          group.add(mesh);
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    }
  }

  waterGroup.visible = false;

  const { scene, dispose } = createScene(root, {
    angleId,
    flush,
    onFrame: (now) => {
      const pose = flush.sample(now);
      handlePivot.rotation.z = pose.handle * 0.95;
      lidPivot.rotation.x = -pose.lid * 1.85;
      seatPivot.rotation.x = -(pose.seat || pose.lid) * 1.4;
      waterGroup.visible = pose.lid > 0.12 || pose.seat > 0.12;
      waterGroup.rotation.y = pose.swirl;
      waterGroup.scale.setScalar(0.55 + pose.level * 0.45);
      group.position.x = pose.shake * 0.01;
    },
  });
  scene.add(group);
  return dispose;
}
