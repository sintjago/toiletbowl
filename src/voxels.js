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
const PIPE = 10;
const HINGE = 11;

const PALETTE = {
  [PORCELAIN]: new THREE.Color("#fffdf8"),
  [SHADE]: new THREE.Color("#cfc8bb"),
  [HIGHLIGHT]: new THREE.Color("#ffffff"),
  [CHROME]: new THREE.Color("#d7e0de"),
  [WATER]: new THREE.Color("#2493b0"),
  [LID]: new THREE.Color("#f7f0e4"),
  [SEAT]: new THREE.Color("#ebe3d6"),
  [INNER]: new THREE.Color("#6f9092"),
  [BOLT]: new THREE.Color("#8f9693"),
  [PIPE]: new THREE.Color("#b7c2bf"),
  [HINGE]: new THREE.Color("#b8b3a8"),
};

const W = 48;
const H = 54;
const D = 50;
const SIZE = 0.038;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}

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
  if (rx <= 0.25 || rz <= 0.25) return false;
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

function roundedBox(voxels, x0, y0, z0, x1, y1, z1, kind, round = 2) {
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const rx = (x1 - x0) / 2;
  const rz = (z1 - z0) / 2;
  for (let y = y0; y <= y1; y += 1) {
    for (let z = z0; z <= z1; z += 1) {
      for (let x = x0; x <= x1; x += 1) {
        const ex = Math.max(0, Math.abs(x - cx) - Math.max(rx - round, 0));
        const ez = Math.max(0, Math.abs(z - cz) - Math.max(rz - round, 0));
        if (ex * ex + ez * ez <= round * round) put(voxels, x, y, z, kind);
      }
    }
  }
}

function fillBall(voxels, cx, cy, cz, r, kind) {
  const r2 = r * r;
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y += 1) {
    for (let z = Math.floor(cz - r); z <= Math.ceil(cz + r); z += 1) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x += 1) {
        const dx = x - cx;
        const dy = y - cy;
        const dz = z - cz;
        if (dx * dx + dy * dy + dz * dz <= r2) put(voxels, x, y, z, kind);
      }
    }
  }
}

function profileAt(y, keys) {
  if (y <= keys[0].y) return keys[0];
  const last = keys[keys.length - 1];
  if (y >= last.y) return last;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const a = keys[i];
    const b = keys[i + 1];
    if (y >= a.y && y <= b.y) {
      const t = smooth((y - a.y) / Math.max(b.y - a.y, 0.001));
      return {
        rx: lerp(a.rx, b.rx, t),
        rz: lerp(a.rz, b.rz, t),
        inner: lerp(a.inner, b.inner, t),
        cz: lerp(a.cz, b.cz, t),
      };
    }
  }
  return last;
}

function buildToilet() {
  const voxels = grid();
  const cx = (W - 1) / 2;
  const bowlZ = 29.4;
  const tankZ0 = 4;
  const tankZ1 = 13;

  const bowl = [
    { y: 0, rx: 11.4, rz: 13.0, inner: 0, cz: bowlZ - 1.6 },
    { y: 2, rx: 10.6, rz: 12.2, inner: 0, cz: bowlZ - 1.6 },
    { y: 6, rx: 6.5, rz: 7.4, inner: 0, cz: bowlZ - 2.2 },
    { y: 11, rx: 7.6, rz: 8.4, inner: 0, cz: bowlZ - 1.4 },
    { y: 15, rx: 11.8, rz: 11.2, inner: 0.28, cz: bowlZ },
    { y: 19, rx: 14.6, rz: 13.4, inner: 0.6, cz: bowlZ },
    { y: 23, rx: 16.0, rz: 14.6, inner: 0.7, cz: bowlZ },
    { y: 25, rx: 16.4, rz: 15.0, inner: 0.73, cz: bowlZ },
  ];

  for (let y = 0; y <= 25; y += 1) {
    const p = profileAt(y, bowl);
    if (p.inner < 0.08) {
      fillEllipse(voxels, y, cx, p.cz, p.rx, p.rz, y === 0 ? SHADE : PORCELAIN);
    } else {
      ringEllipse(voxels, y, cx, p.cz, p.rx, p.rz, p.inner, PORCELAIN);
      ringEllipse(
        voxels,
        y,
        cx,
        p.cz,
        p.rx * p.inner + 1.1,
        p.rz * p.inner + 1.0,
        0.52,
        INNER,
      );
    }
  }

  ringEllipse(voxels, 0, cx, bowlZ - 1.6, 11.6, 13.2, 0.82, SHADE);
  put(voxels, cx - 8, 0, bowlZ + 7, BOLT);
  put(voxels, cx + 8, 0, bowlZ + 7, BOLT);
  put(voxels, cx - 8, 1, bowlZ + 7, BOLT);
  put(voxels, cx + 8, 1, bowlZ + 7, BOLT);
  put(voxels, cx - 8, 0, bowlZ - 9, BOLT);
  put(voxels, cx + 8, 0, bowlZ - 9, BOLT);
  put(voxels, cx - 8, 1, bowlZ - 9, BOLT);
  put(voxels, cx + 8, 1, bowlZ - 9, BOLT);

  for (let y = 4; y <= 12; y += 1) {
    fillEllipse(voxels, y, cx, bowlZ - 8.4, 4.2, 6.2, PORCELAIN);
  }

  ringEllipse(voxels, 25, cx, bowlZ, 16.8, 15.3, 0.74, HIGHLIGHT);
  ringEllipse(voxels, 24, cx, bowlZ, 16.2, 14.8, 0.8, SHADE);

  for (let y = 17; y <= 20; y += 1) {
    fillEllipse(voxels, y, cx, bowlZ + 0.3, 8.2, 7.6, WATER);
  }
  fillEllipse(voxels, 16, cx, bowlZ + 0.3, 6.6, 6.0, INNER);

  ringEllipse(voxels, 26, cx, bowlZ + 0.2, 15.4, 14.0, 0.6, SEAT);
  ringEllipse(voxels, 27, cx, bowlZ + 0.15, 15.0, 13.6, 0.63, SEAT);
  ringEllipse(voxels, 26, cx, bowlZ + 0.2, 14.6, 13.2, 0.72, SHADE);

  fillEllipse(voxels, 28, cx, bowlZ - 0.15, 15.6, 14.4, LID);
  fillEllipse(voxels, 29, cx, bowlZ - 0.3, 15.2, 14.0, LID);
  fillEllipse(voxels, 30, cx, bowlZ - 0.45, 14.4, 13.2, LID);
  fillEllipse(voxels, 30, cx, bowlZ - 0.45, 10.4, 9.4, HIGHLIGHT);

  roundedBox(voxels, 10, 23, tankZ0, 37, 46, tankZ1, PORCELAIN, 2.4);
  roundedBox(voxels, 11, 24, tankZ0 + 1, 36, 45, tankZ1 - 1, PORCELAIN, 1.8);
  roundedBox(voxels, 9, 47, tankZ0 - 1, 38, 48, tankZ1 + 1, SHADE, 2.0);
  roundedBox(voxels, 10, 47, tankZ0, 37, 47, tankZ1, HIGHLIGHT, 2.2);
  for (let z = tankZ0 + 2; z <= tankZ1 - 2; z += 1) {
    put(voxels, 10, 34, z, SHADE);
    put(voxels, 37, 34, z, SHADE);
  }

  for (let y = 23; y <= 28; y += 1) {
    fillEllipse(voxels, y, cx, 15.2, 6.6, 4.6, PORCELAIN);
  }

  put(voxels, cx - 5, 27, 16, HINGE);
  put(voxels, cx - 5, 28, 16, HINGE);
  put(voxels, cx - 5, 27, 17, HINGE);
  put(voxels, cx + 5, 27, 16, HINGE);
  put(voxels, cx + 5, 28, 16, HINGE);
  put(voxels, cx + 5, 27, 17, HINGE);

  const handleY = 40;
  const handleZ = tankZ1 + 1;
  for (let x = 12; x <= 20; x += 1) {
    put(voxels, x, handleY, handleZ, CHROME);
    put(voxels, x, handleY, handleZ + 1, CHROME);
  }
  put(voxels, 20, handleY, tankZ1, CHROME);
  put(voxels, 20, handleY - 1, handleZ, CHROME);
  put(voxels, 20, handleY + 1, handleZ, CHROME);
  fillBall(voxels, 12, handleY, handleZ + 0.5, 1.35, CHROME);

  for (let y = 1; y <= 24; y += 1) put(voxels, 11, y, 6, PIPE);
  for (let z = 6; z <= 8; z += 1) put(voxels, 11, 24, z, PIPE);
  put(voxels, 11, 1, 6, BOLT);
  put(voxels, 11, 2, 6, PIPE);

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
  const ao = 0.56 + (neighborCount(voxels, x, y, z) / 6) * 0.44;
  const dither = 0.95 + ((x * 17 + y * 31 + z * 13) % 7) * 0.01;
  const color = PALETTE[kind].clone().multiplyScalar(ao * dither);
  if (kind === WATER) color.multiplyScalar(0.82 + ((x + z) % 4) * 0.07);
  return color;
}

function instancedGroup(voxels, cells, kind, origin) {
  if (!cells.length) return null;
  const geo = new THREE.BoxGeometry(SIZE * 0.92, SIZE * 0.92, SIZE * 0.92);
  const mat = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: kind === WATER ? 0.1 : kind === CHROME || kind === PIPE ? 0.2 : 0.36,
    metalness: kind === CHROME || kind === PIPE ? 0.84 : kind === WATER ? 0.14 : 0.045,
    transparent: kind === WATER,
    opacity: kind === WATER ? 0.84 : 1,
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

function averageWorld(cells) {
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
  const n = cells.length;
  return new THREE.Vector3(sum.x / n, sum.y / n, sum.z / n);
}

function hingeOf(cells) {
  if (!cells.length) return new THREE.Vector3();
  let minZ = Infinity;
  cells.forEach((cell) => {
    if (cell.z < minZ) minZ = cell.z;
  });
  return averageWorld(cells.filter((cell) => cell.z <= minZ + 2));
}

function handleMountOf(cells) {
  if (!cells.length) return new THREE.Vector3();
  let maxX = -Infinity;
  cells.forEach((cell) => {
    if (cell.x > maxX) maxX = cell.x;
  });
  return averageWorld(cells.filter((cell) => cell.x >= maxX - 1));
}

function centroid(cells) {
  if (!cells.length) return new THREE.Vector3();
  return averageWorld(cells);
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
  const bodyKinds = [PORCELAIN, SHADE, HIGHLIGHT, INNER, BOLT, PIPE, HINGE];

  const lidAnchor = hingeOf(lidCells);
  const handleAnchor = handleMountOf(handleCells);
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
      handlePivot.rotation.z = pose.handle * 1.05;
      lidPivot.rotation.x = -pose.lid * 1.48;
      waterGroup.visible = pose.lid > 0.08;
      waterGroup.rotation.y = pose.swirl;
      waterGroup.scale.setScalar(0.86 + pose.level * 0.14);
      group.position.x = pose.shake * 0.01;
    },
  });

  const rim = new THREE.DirectionalLight("#fff4e6", 0.42);
  rim.position.set(-1.8, 3.4, 4.2);
  scene.add(rim);

  group.position.y = 0.01;
  scene.add(group);
  return dispose;
}
