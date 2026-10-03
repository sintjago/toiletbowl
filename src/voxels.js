import * as THREE from "three";
import { createScene } from "./scene.js";

const EMPTY = 0;
const PORCELAIN = 1;
const SHADE = 2;
const HIGHLIGHT = 3;
const CHROME = 4;
const WATER = 5;
const LID = 6;
const SEAT = 7;
const INNER = 8;
const BOLT = 9;

const PALETTE = {
  [PORCELAIN]: new THREE.Color("#fffdf8"),
  [SHADE]: new THREE.Color("#d4cfc4"),
  [HIGHLIGHT]: new THREE.Color("#ffffff"),
  [CHROME]: new THREE.Color("#c5d0ce"),
  [WATER]: new THREE.Color("#2a9bb8"),
  [LID]: new THREE.Color("#f4ead8"),
  [SEAT]: new THREE.Color("#efe8dc"),
  [INNER]: new THREE.Color("#8aa8a8"),
  [BOLT]: new THREE.Color("#9aa19e"),
};

const W = 36;
const H = 40;
const D = 40;
const SIZE = 0.052;

function grid() {
  return Array.from({ length: H }, () =>
    Array.from({ length: D }, () => Array.from({ length: W }, () => EMPTY)),
  );
}

function inside(x, y, z) {
  return x >= 0 && y >= 0 && z >= 0 && x < W && y < H && z < D;
}

function put(voxels, x, y, z, kind) {
  const ix = Math.round(x);
  const iy = Math.round(y);
  const iz = Math.round(z);
  if (inside(ix, iy, iz) && kind) voxels[iy][iz][ix] = kind;
}

function ellipse(x, z, cx, cz, rx, rz) {
  if (rx <= 0.2 || rz <= 0.2) return false;
  const dx = (x - cx) / rx;
  const dz = (z - cz) / rz;
  return dx * dx + dz * dz <= 1;
}

function fillEllipse(voxels, y, cx, cz, rx, rz, kind) {
  const z0 = Math.floor(cz - rz);
  const z1 = Math.ceil(cz + rz);
  const x0 = Math.floor(cx - rx);
  const x1 = Math.ceil(cx + rx);
  for (let z = z0; z <= z1; z += 1) {
    for (let x = x0; x <= x1; x += 1) {
      if (ellipse(x, z, cx, cz, rx, rz)) put(voxels, x, y, z, kind);
    }
  }
}

function ringEllipse(voxels, y, cx, cz, rx, rz, inner, kind) {
  const z0 = Math.floor(cz - rz);
  const z1 = Math.ceil(cz + rz);
  const x0 = Math.floor(cx - rx);
  const x1 = Math.ceil(cx + rx);
  for (let z = z0; z <= z1; z += 1) {
    for (let x = x0; x <= x1; x += 1) {
      if (
        ellipse(x, z, cx, cz, rx, rz) &&
        !ellipse(x, z, cx, cz, rx * inner, rz * inner)
      ) {
        put(voxels, x, y, z, kind);
      }
    }
  }
}

function roundedBox(voxels, x0, y0, z0, x1, y1, z1, kind, round = 1.6) {
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const rx = (x1 - x0) / 2;
  const rz = (z1 - z0) / 2;
  for (let y = y0; y <= y1; y += 1) {
    for (let z = z0; z <= z1; z += 1) {
      for (let x = x0; x <= x1; x += 1) {
        const ex = Math.max(0, Math.abs(x - cx) - (rx - round));
        const ez = Math.max(0, Math.abs(z - cz) - (rz - round));
        if (ex * ex + ez * ez <= round * round) put(voxels, x, y, z, kind);
      }
    }
  }
}

function buildToilet() {
  const voxels = grid();
  const cx = (W - 1) / 2;
  const bowlZ = 23.2;
  const tankZ0 = 3;
  const tankZ1 = 10;

  for (let y = 0; y <= 1; y += 1) {
    fillEllipse(voxels, y, cx, bowlZ - 1.2, 8.4 - y * 0.3, 9.6 - y * 0.2, PORCELAIN);
  }
  put(voxels, cx - 6, 0, bowlZ + 5, BOLT);
  put(voxels, cx + 6, 0, bowlZ + 5, BOLT);
  put(voxels, cx - 6, 0, bowlZ - 7, BOLT);
  put(voxels, cx + 6, 0, bowlZ - 7, BOLT);

  for (let y = 2; y <= 6; y += 1) {
    const t = (y - 2) / 4;
    fillEllipse(voxels, y, cx, bowlZ - 1.6, 5.1 + t * 1.1, 6.2 + t * 1.4, PORCELAIN);
  }

  for (let y = 3; y <= 8; y += 1) {
    fillEllipse(voxels, y, cx, bowlZ - 6.2, 3.6, 5.2, PORCELAIN);
  }

  for (let y = 6; y <= 17; y += 1) {
    const t = (y - 6) / 11;
    let orx;
    let orz;
    let inner;
    if (t < 0.22) {
      orx = 6.2 + t * 18;
      orz = 6.4 + t * 16;
      inner = 0;
    } else if (t < 0.72) {
      orx = 10.2 + (t - 0.22) * 3.6;
      orz = 9.9 + (t - 0.22) * 3.2;
      inner = 0.58 + (t - 0.22) * 0.12;
    } else {
      orx = 12.1;
      orz = 11.4;
      inner = 0.68;
    }
    if (inner <= 0.05) {
      fillEllipse(voxels, y, cx, bowlZ, orx, orz, PORCELAIN);
    } else {
      ringEllipse(voxels, y, cx, bowlZ, orx, orz, inner, PORCELAIN);
      ringEllipse(voxels, y, cx, bowlZ, orx * inner + 0.9, orz * inner + 0.8, 0.55, INNER);
    }
  }

  ringEllipse(voxels, 17, cx, bowlZ, 12.4, 11.7, 0.7, HIGHLIGHT);
  ringEllipse(voxels, 16, cx, bowlZ, 12.0, 11.3, 0.78, SHADE);

  for (let y = 10; y <= 13; y += 1) {
    fillEllipse(voxels, y, cx, bowlZ + 0.2, 6.4, 6.0, WATER);
  }
  fillEllipse(voxels, 9, cx, bowlZ + 0.2, 5.2, 4.8, INNER);

  ringEllipse(voxels, 18, cx, bowlZ + 0.15, 11.6, 10.8, 0.62, SEAT);
  ringEllipse(voxels, 18, cx, bowlZ + 0.15, 11.2, 10.4, 0.7, SHADE);

  fillEllipse(voxels, 19, cx, bowlZ - 0.2, 11.8, 11.0, LID);
  fillEllipse(voxels, 20, cx, bowlZ - 0.35, 11.4, 10.6, LID);
  fillEllipse(voxels, 20, cx, bowlZ - 0.35, 8.2, 7.4, HIGHLIGHT);

  roundedBox(voxels, 8, 16, tankZ0, 27, 33, tankZ1, PORCELAIN, 1.8);
  roundedBox(voxels, 7, 34, tankZ0 - 1, 28, 35, tankZ1 + 1, SHADE, 1.4);
  roundedBox(voxels, 8, 34, tankZ0, 27, 34, tankZ1, HIGHLIGHT, 1.6);
  for (let z = tankZ0 + 1; z <= tankZ1 - 1; z += 1) {
    put(voxels, 8, 22, z, SHADE);
    put(voxels, 27, 22, z, SHADE);
  }

  for (let x = 10; x <= 14; x += 1) put(voxels, x, 29, tankZ1 + 1, CHROME);
  put(voxels, 10, 28, tankZ1 + 1, CHROME);
  put(voxels, 10, 30, tankZ1 + 1, CHROME);
  put(voxels, 9, 29, tankZ1 + 1, CHROME);
  put(voxels, 10, 29, tankZ1, CHROME);
  put(voxels, 15, 29, tankZ1 + 1, CHROME);

  for (let y = 16; y <= 19; y += 1) {
    fillEllipse(voxels, y, cx, 11.8, 5.2, 3.8, PORCELAIN);
  }

  return voxels;
}

function neighborCount(voxels, x, y, z) {
  let n = 0;
  if (inside(x - 1, y, z) && voxels[y][z][x - 1]) n += 1;
  if (inside(x + 1, y, z) && voxels[y][z][x + 1]) n += 1;
  if (inside(x, y - 1, z) && voxels[y - 1][z][x]) n += 1;
  if (inside(x, y + 1, z) && voxels[y + 1][z][x]) n += 1;
  if (inside(x, y, z - 1) && voxels[y][z - 1][x]) n += 1;
  if (inside(x, y, z + 1) && voxels[y][z + 1][x]) n += 1;
  return n;
}

function worldPos(x, y, z) {
  return new THREE.Vector3((x - (W - 1) / 2) * SIZE, y * SIZE, (z - (D - 1) / 2) * SIZE);
}

function collect(voxels, kind) {
  const cells = [];
  for (let y = 0; y < H; y += 1) {
    for (let z = 0; z < D; z += 1) {
      for (let x = 0; x < W; x += 1) {
        if (voxels[y][z][x] === kind) cells.push({ x, y, z });
      }
    }
  }
  return cells;
}

function toneFor(voxels, cell, kind) {
  const { x, y, z } = cell;
  const ao = 0.62 + (neighborCount(voxels, x, y, z) / 6) * 0.38;
  const dither = 0.94 + ((x * 17 + y * 31 + z * 13) % 8) * 0.01;
  const color = PALETTE[kind].clone().multiplyScalar(ao * dither);
  if (kind === WATER) color.multiplyScalar(0.85 + ((x + z) % 3) * 0.08);
  return color;
}

function instancedGroup(voxels, cells, kind, origin) {
  if (!cells.length) return null;
  const geo = new THREE.BoxGeometry(SIZE * 0.9, SIZE * 0.9, SIZE * 0.9);
  const mat = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: kind === WATER ? 0.12 : kind === CHROME ? 0.22 : 0.38,
    metalness: kind === CHROME ? 0.82 : kind === WATER ? 0.12 : 0.04,
    transparent: kind === WATER,
    opacity: kind === WATER ? 0.82 : 1,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, cells.length);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const dummy = new THREE.Object3D();
  cells.forEach((cell, i) => {
    const world = worldPos(cell.x, cell.y, cell.z);
    dummy.position.copy(origin ? world.clone().sub(origin) : world);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, toneFor(voxels, cell, kind));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}

function hingeOf(cells) {
  if (!cells.length) return new THREE.Vector3();
  let minZ = Infinity;
  cells.forEach((cell) => {
    if (cell.z < minZ) minZ = cell.z;
  });
  const back = cells.filter((cell) => cell.z <= minZ + 1);
  const sum = back.reduce(
    (acc, cell) => {
      const w = worldPos(cell.x, cell.y, cell.z);
      acc.x += w.x;
      acc.y += w.y;
      acc.z += w.z;
      return acc;
    },
    { x: 0, y: 0, z: 0 },
  );
  const n = back.length;
  return new THREE.Vector3(sum.x / n, sum.y / n, sum.z / n);
}

function centroid(cells) {
  if (!cells.length) return new THREE.Vector3();
  const sum = cells.reduce(
    (acc, cell) => {
      const w = worldPos(cell.x, cell.y, cell.z);
      acc.x += w.x;
      acc.y += w.y;
      acc.z += w.z;
      return acc;
    },
    { x: 0, y: 0, z: 0 },
  );
  return new THREE.Vector3(sum.x / cells.length, sum.y / cells.length, sum.z / cells.length);
}

export function mountVoxels(root, { angleId, flush }) {
  const voxels = buildToilet();
  const group = new THREE.Group();
  const lidPivot = new THREE.Group();
  const handlePivot = new THREE.Group();
  const waterGroup = new THREE.Group();

  const lidCells = collect(voxels, LID);
  const seatCells = collect(voxels, SEAT);
  const handleCells = collect(voxels, CHROME);
  const waterCells = collect(voxels, WATER);
  const bodyKinds = [PORCELAIN, SHADE, HIGHLIGHT, INNER, BOLT];

  const lidAnchor = hingeOf(lidCells);
  const handleAnchor = centroid(handleCells);
  const waterAnchor = centroid(waterCells);

  lidPivot.position.copy(lidAnchor);
  handlePivot.position.copy(handleAnchor);
  waterGroup.position.copy(waterAnchor);
  group.add(lidPivot, handlePivot, waterGroup);

  bodyKinds.forEach((kind) => {
    const mesh = instancedGroup(voxels, collect(voxels, kind), kind, null);
    if (mesh) group.add(mesh);
  });
  const seatMesh = instancedGroup(voxels, seatCells, SEAT, null);
  if (seatMesh) group.add(seatMesh);
  const lidMesh = instancedGroup(voxels, lidCells, LID, lidAnchor);
  if (lidMesh) lidPivot.add(lidMesh);
  const handleMesh = instancedGroup(voxels, handleCells, CHROME, handleAnchor);
  if (handleMesh) handlePivot.add(handleMesh);
  const waterMesh = instancedGroup(voxels, waterCells, WATER, waterAnchor);
  if (waterMesh) waterGroup.add(waterMesh);

  waterGroup.visible = false;

  const { scene, dispose } = createScene(root, {
    angleId,
    flush,
    onFrame: (now) => {
      const pose = flush.sample(now);
      handlePivot.rotation.z = pose.handle * 0.95;
      lidPivot.rotation.x = -pose.lid * 1.35;
      waterGroup.visible = pose.lid > 0.08;
      waterGroup.rotation.y = pose.swirl;
      waterGroup.scale.setScalar(0.88 + pose.level * 0.12);
      group.position.x = pose.shake * 0.01;
    },
  });
  group.position.y = 0.012;
  scene.add(group);
  return dispose;
}
