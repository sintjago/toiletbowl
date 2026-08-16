import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvas = document.getElementById("c");
const loading = document.getElementById("loading");
const statusEl = document.getElementById("status");
const rosterEl = document.getElementById("roster");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a0b0c);
scene.fog = new THREE.Fog(0x1a0b0c, 90, 220);

const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 500);
camera.position.set(38, 42, 78);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(0, 18, 0);
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 28;
controls.maxDistance = 160;

scene.add(new THREE.HemisphereLight(0xffe6c4, 0x3a1810, 0.7));
const key = new THREE.DirectionalLight(0xfff1d6, 1.15);
key.position.set(40, 70, 35);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 10;
key.shadow.camera.far = 180;
key.shadow.camera.left = -60;
key.shadow.camera.right = 60;
key.shadow.camera.top = 60;
key.shadow.camera.bottom = -60;
scene.add(key);
const fill = new THREE.DirectionalLight(0x88aadd, 0.28);
fill.position.set(-50, 20, -30);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xffc978, 0.35);
rim.position.set(-10, 30, 60);
scene.add(rim);

function woodTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#6b3d24";
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 80; i++) {
    const y = (i / 80) * 512 + Math.sin(i * 0.7) * 6;
    g.strokeStyle = `rgba(40,18,10,${0.08 + (i % 3) * 0.05})`;
    g.lineWidth = 2 + (i % 4);
    g.beginPath();
    g.moveTo(0, y);
    for (let x = 0; x <= 512; x += 16) {
      g.lineTo(x, y + Math.sin(x * 0.04 + i) * 4);
    }
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const table = new THREE.Mesh(
  new THREE.CylinderGeometry(70, 70, 3.2, 64),
  new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.7, metalness: 0.05 })
);
table.position.y = -1.6;
table.receiveShadow = true;
scene.add(table);

const rug = new THREE.Mesh(
  new THREE.CircleGeometry(42, 64),
  new THREE.MeshStandardMaterial({ color: 0x7a1c24, roughness: 0.85 })
);
rug.rotation.x = -Math.PI / 2;
rug.position.y = 0.05;
rug.receiveShadow = true;
scene.add(rug);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const dummy = new THREE.Object3D();
const tmpColor = new THREE.Color();
const boxGeo = new THREE.BoxGeometry(1, 1, 1);

let data = null;
let actors = [];
let selected = 0;
let dragging = null;
let dragOffset = new THREE.Vector3();
let pointerDown = null;
const clock = new THREE.Clock();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const planeHit = new THREE.Vector3();

function hexOf(palette, i) {
  return palette[i] || "#888888";
}

function makeInstanced(voxels, palette, origin) {
  const mesh = new THREE.InstancedMesh(
    boxGeo,
    new THREE.MeshStandardMaterial({ roughness: 0.48, metalness: 0.06 }),
    voxels.length
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const occ = new Set(voxels.map((v) => `${v[0]},${v[1]},${v[2]}`));
  voxels.forEach((v, i) => {
    dummy.position.set(v[0] - origin.x, v[1] - origin.y, v[2] - origin.z);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    let n = 0;
    for (const [dx, dy, dz] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]) {
      if (occ.has(`${v[0]+dx},${v[1]+dy},${v[2]+dz}`)) n++;
    }
    const ao = 0.62 + 0.38 * (1 - n / 6);
    tmpColor.set(hexOf(palette, v[3])).multiplyScalar(ao);
    mesh.setColorAt(i, tmpColor);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceColor.needsUpdate = true;
  return mesh;
}

function hitProxy(w, h, d, y0, y1, part, index) {
  const geo = new THREE.CylinderGeometry(Math.max(w, d) * 0.42, Math.max(w, d) * 0.48, Math.max(2, y1 - y0), 12);
  const mat = new THREE.MeshBasicMaterial({ visible: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = (y0 + y1) / 2;
  mesh.userData = { part, index };
  return mesh;
}

class DollActor {
  constructor(index, spec, palette, nestLocal) {
    this.index = index;
    this.spec = spec;
    this.w = spec.size[0];
    this.h = spec.size[1];
    this.d = spec.size[2];
    this.splitY = spec.splitY;
    this.hollow = spec.hollow;
    this.nestLocal = nestLocal; // offset inside parent, in parent voxel space
    this.origin = { x: (this.w - 1) / 2, y: 0, z: (this.d - 1) / 2 };

    this.group = new THREE.Group();
    this.lidGroup = new THREE.Group();
    this.baseGroup = new THREE.Group();
    this.group.add(this.baseGroup);
    this.group.add(this.lidGroup);

    if (spec.base.length) {
      this.baseGroup.add(makeInstanced(spec.base, palette, this.origin));
    }
    if (spec.lid.length) {
      this.lidGroup.add(makeInstanced(spec.lid, palette, this.origin));
    } else {
      // solid baby: whole doll is the "base"
    }

    const lidMin = spec.hollow ? this.splitY : this.h;
    this.baseHit = hitProxy(this.w, this.h, this.d, 0, lidMin, "base", index);
    this.lidHit = hitProxy(this.w, this.h, this.d, lidMin, this.h, "lid", index);
    this.baseGroup.add(this.baseHit);
    this.lidGroup.add(this.lidHit);

    this.open = false;
    this.lidT = 0;
    this.lidGoal = 0;
    this.nestedIn = index > 0 ? index - 1 : null;
    this.pos = new THREE.Vector3();
    this.goal = new THREE.Vector3();
    this.yaw = 0;
    this.goalYaw = 0;
    scene.add(this.group);
  }

  worldPos() {
    if (this.nestedIn == null) return this.pos.clone();
    const parent = actors[this.nestedIn];
    const p = parent.worldPos();
    const off = this.nestLocal;
    p.x += off[0] + (this.w - parent.w) / 2;
    p.y += off[1];
    p.z += off[2] + (this.d - parent.d) / 2;
    return p;
  }
}

function lineupX(index) {
  let x = -48;
  for (let i = 0; i < index; i++) x += actors[i].w + 6;
  x += actors[index].w / 2;
  return x;
}

function setStatus() {
  const a = actors[selected];
  const bits = [];
  bits.push(`${a.spec.nameRu} · ${a.spec.name}`);
  if (a.nestedIn != null) bits.push("nested");
  else if (a.open) bits.push("open");
  else bits.push("on the table");
  statusEl.textContent = bits.join("  —  ");
  [...rosterEl.querySelectorAll("button")].forEach((b, i) => {
    b.classList.toggle("active", i === selected);
  });
}

function openDoll(i) {
  const a = actors[i];
  if (!a.hollow) {
    selected = i;
    setStatus();
    return;
  }
  if (a.nestedIn != null) {
    const p = actors[a.nestedIn];
    if (!p.open) openDoll(a.nestedIn);
    // cannot open while fully boxed in a closed parent
    if (!p.open) return;
  }
  a.open = true;
  a.lidGoal = 1;
  selected = i;
  setStatus();
}

function closeDoll(i) {
  const a = actors[i];
  a.open = false;
  a.lidGoal = 0;
  selected = i;
  setStatus();
}

function takeOut(i) {
  const child = actors[i];
  if (child.nestedIn == null) return;
  const parent = actors[child.nestedIn];
  if (!parent.open) openDoll(parent.index);
  child.nestedIn = null;
  const p = parent.worldPos();
  child.pos.copy(p);
  child.pos.y += 8;
  child.goal.set(lineupX(i), 0, 14 + (i % 2) * 4);
  child.goalYaw = 0;
  selected = i;
  setStatus();
}

function nestIntoParent(childIndex) {
  const child = actors[childIndex];
  if (childIndex === 0) return;
  const parent = actors[childIndex - 1];
  if (parent.nestedIn != null) return;
  if (!parent.open) openDoll(parent.index);
  // any occupant? only the designed child fits
  const occupant = actors.find((a) => a.nestedIn === parent.index);
  if (occupant && occupant.index !== child.index) takeOut(occupant.index);
  child.nestedIn = parent.index;
  child.open = false;
  child.lidGoal = 0;
  child.goal.copy(child.worldPos());
  selected = childIndex;
  setStatus();
}

function nestAll() {
  for (let i = actors.length - 1; i >= 1; i--) {
    actors[i].open = false;
    actors[i].lidGoal = 0;
    actors[i].nestedIn = i - 1;
  }
  actors[0].open = false;
  actors[0].lidGoal = 0;
  actors[0].goal.set(0, 0, 0);
  selected = 0;
  setStatus();
}

function lineUp() {
  actors.forEach((a, i) => {
    a.nestedIn = null;
    a.open = false;
    a.lidGoal = 0;
    a.goal.set(lineupX(i) + 18, 0, 0);
    a.goalYaw = 0;
  });
  selected = 0;
  setStatus();
}

function takeNext() {
  const nested = actors.find((a) => a.nestedIn != null);
  if (!nested) {
    setStatus();
    return;
  }
  const parent = actors[nested.nestedIn];
  if (!parent.open) {
    openDoll(parent.index);
    return;
  }
  takeOut(nested.index);
}

function openNext() {
  const closed = actors.find((a) => a.hollow && !a.open && (a.nestedIn == null || actors[a.nestedIn].open));
  if (closed) openDoll(closed.index);
  else takeNext();
}

function buildRoster() {
  rosterEl.innerHTML = "";
  actors.forEach((a, i) => {
    const b = document.createElement("button");
    b.className = "doll-btn";
    b.innerHTML = `<span class="ru">${a.spec.nameRu}</span>${a.spec.name}`;
    b.addEventListener("click", () => {
      selected = i;
      if (a.nestedIn != null) {
        const p = actors[a.nestedIn];
        if (!p.open) openDoll(p.index);
        else takeOut(i);
      } else if (a.hollow && !a.open) openDoll(i);
      else if (a.open) closeDoll(i);
      setStatus();
    });
    rosterEl.appendChild(b);
  });
}

function pick(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = [];
  actors.forEach((a) => {
    if (a.nestedIn != null) {
      const p = actors[a.nestedIn];
      if (!p.open) return;
    }
    const objs = [a.baseHit, a.lidHit];
    const found = raycaster.intersectObjects(objs, false);
    found.forEach((h) => hits.push(h));
  });
  hits.sort((a, b) => a.distance - b.distance);
  return hits[0] || null;
}

canvas.addEventListener("pointerdown", (e) => {
  const hit = pick(e);
  pointerDown = { x: e.clientX, y: e.clientY, hit, t: performance.now() };
  if (hit && e.button === 0) {
    const idx = hit.object.userData.index;
    const a = actors[idx];
    if (a.nestedIn == null) {
      dragging = a;
      controls.enabled = false;
      raycaster.setFromCamera(pointer, camera);
      raycaster.ray.intersectPlane(plane, planeHit);
      dragOffset.copy(a.pos).sub(planeHit);
    }
  }
});

canvas.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  if (raycaster.ray.intersectPlane(plane, planeHit)) {
    dragging.goal.set(planeHit.x + dragOffset.x, 0, planeHit.z + dragOffset.z);
    dragging.pos.y = 1.2;
  }
});

canvas.addEventListener("pointerup", (e) => {
  const moved = pointerDown && Math.hypot(e.clientX - pointerDown.x, e.clientY - pointerDown.y) > 6;
  const a = dragging;
  dragging = null;
  controls.enabled = true;
  if (a) a.goal.y = 0;

  if (!moved && pointerDown?.hit) {
    const { index, part } = pointerDown.hit.object.userData;
    const doll = actors[index];
    selected = index;
    if (doll.nestedIn != null) {
      takeOut(index);
    } else if (part === "lid" && doll.open) {
      closeDoll(index);
    } else if (doll.hollow && !doll.open) {
      openDoll(index);
    } else if (doll.open) {
      const child = actors[index + 1];
      if (child && child.nestedIn === index) takeOut(child.index);
      else closeDoll(index);
    }
    setStatus();
  } else if (a && a.index > 0) {
    const parent = actors[a.index - 1];
    if (parent.nestedIn == null && parent.open) {
      const dx = a.goal.x - parent.pos.x;
      const dz = a.goal.z - parent.pos.z;
      if (Math.hypot(dx, dz) < parent.w * 0.55) nestIntoParent(a.index);
    }
  }
  pointerDown = null;
});

window.addEventListener("keydown", (e) => {
  if (e.key === " ") { e.preventDefault(); openNext(); }
  if (e.key === "o" || e.key === "O") openNext();
  if (e.key === "t" || e.key === "T") takeNext();
  if (e.key === "n" || e.key === "N") nestAll();
  if (e.key === "l" || e.key === "L") lineUp();
  if (e.key >= "1" && e.key <= "5") {
    selected = Number(e.key) - 1;
    setStatus();
  }
});

document.getElementById("btn-open").addEventListener("click", openNext);
document.getElementById("btn-take").addEventListener("click", takeNext);
document.getElementById("btn-line").addEventListener("click", lineUp);
document.getElementById("btn-nest").addEventListener("click", nestAll);

function updateActors(dt) {
  const k = 1 - Math.exp(-dt * 7);
  const kLid = 1 - Math.exp(-dt * 8);
  actors.forEach((a) => {
    if (a.nestedIn != null) {
      const wp = a.worldPos();
      a.pos.lerp(wp, k);
      a.goal.copy(wp);
    } else {
      a.pos.lerp(a.goal, k);
    }
    a.lidT += (a.lidGoal - a.lidT) * kLid;
    a.yaw += (a.goalYaw - a.yaw) * k;
    a.group.position.copy(a.pos);
    a.group.rotation.y = a.yaw;
    const lift = a.lidT;
    a.lidGroup.position.set(0, lift * (6 + a.h * 0.08), lift * -3.2);
    a.lidGroup.rotation.x = lift * -0.42;
  });
}

function onResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}
window.addEventListener("resize", onResize);

function tick() {
  const dt = Math.min(0.05, clock.getDelta());
  updateActors(dt);
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

async function main() {
  data = await fetch("models/dolls.json").then((r) => r.json());
  const palette = data.palette;
  actors = data.dolls.map((spec, i) => {
    const nestLocal = i > 0 ? data.nestOffsets[i - 1] : [0, 0, 0];
    return new DollActor(i, spec, palette, nestLocal);
  });
  actors[0].pos.set(0, 0, 0);
  actors[0].goal.set(0, 0, 0);
  for (let i = 1; i < actors.length; i++) {
    actors[i].nestedIn = i - 1;
    actors[i].pos.copy(actors[i].worldPos());
    actors[i].goal.copy(actors[i].pos);
  }
  buildRoster();
  setStatus();
  loading.hidden = true;
  tick();
}

main().catch((err) => {
  loading.textContent = "Could not load dolls.json";
  console.error(err);
});
