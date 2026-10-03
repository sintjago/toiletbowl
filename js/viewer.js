import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const canvas = document.getElementById("c");
const loading = document.getElementById("loading");
const statusEl = document.getElementById("status");
const rosterEl = document.getElementById("roster");
const GOLD_IDX = new Set([12, 13, 14]);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.26;

const HOME_CAM = new THREE.Vector3(92, 48, 188);
const HOME_TARGET = new THREE.Vector3(-2, 18, 2);
const HOME_YAW = Math.atan2(HOME_CAM.x, HOME_CAM.z);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x100608);
scene.fog = new THREE.FogExp2(0x100608, 0.0024);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.4, 900);
camera.position.copy(HOME_CAM);
camera.lookAt(HOME_TARGET);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.target.copy(HOME_TARGET);
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 105;
controls.maxDistance = 420;

scene.add(new THREE.HemisphereLight(0xffe0b8, 0x1a0a0c, 0.52));
const key = new THREE.DirectionalLight(0xfff1d6, 0.7);
key.position.set(50, 80, 40);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.near = 10;
key.shadow.camera.far = 280;
key.shadow.camera.left = -90;
key.shadow.camera.right = 90;
key.shadow.camera.top = 70;
key.shadow.camera.bottom = -70;
key.shadow.bias = -0.0008;
scene.add(key);
const fill = new THREE.DirectionalLight(0x6a80c0, 0.16);
fill.position.set(-70, 24, -36);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xfff6e4, 0.28);
rim.position.set(8, 28, 90);
scene.add(rim);
const bounce = new THREE.PointLight(0xff7a40, 0.22, 90, 2);
bounce.position.set(0, 4, 8);
scene.add(bounce);

const lampRig = new THREE.Group();
lampRig.position.set(-8, 109, 14);
scene.add(lampRig);
const canopy = new THREE.Mesh(
  new THREE.CylinderGeometry(4.2, 3.2, 2.4, 16),
  new THREE.MeshStandardMaterial({ color: 0xc4a060, metalness: 0.72, roughness: 0.28 })
);
lampRig.add(canopy);
const chain = new THREE.Mesh(
  new THREE.CylinderGeometry(0.18, 0.18, 22, 8),
  new THREE.MeshStandardMaterial({ color: 0xc4a060, metalness: 0.65, roughness: 0.32 })
);
chain.position.y = -12;
lampRig.add(chain);
const shade = new THREE.Mesh(
  new THREE.CylinderGeometry(3.4, 15, 13, 24, 1, true),
  new THREE.MeshStandardMaterial({
    color: 0x8e1c24,
    emissive: 0x5a1808,
    emissiveIntensity: 0.42,
    roughness: 0.55,
    side: THREE.DoubleSide,
  })
);
shade.position.y = -24;
lampRig.add(shade);
const shadeTrim = new THREE.Mesh(
  new THREE.TorusGeometry(15, 0.35, 6, 28),
  new THREE.MeshStandardMaterial({ color: 0xe4b23c, metalness: 0.7, roughness: 0.3 })
);
shadeTrim.position.y = -30.4;
shadeTrim.rotation.x = Math.PI / 2;
lampRig.add(shadeTrim);
const lamp = new THREE.PointLight(0xffc878, 1.15, 200, 1.5);
lamp.position.y = -26;
lampRig.add(lamp);
const spot = new THREE.SpotLight(0xffd090, 4.4, 260, Math.PI / 5.2, 0.62, 1.15);
spot.position.y = -26;
spot.castShadow = true;
spot.shadow.mapSize.set(1024, 1024);
spot.shadow.camera.near = 8;
spot.shadow.camera.far = 200;
spot.shadow.bias = -0.0012;
lampRig.add(spot);
const spotTarget = new THREE.Object3D();
spotTarget.position.set(8, -108, -14);
lampRig.add(spotTarget);
spot.target = spotTarget;
const bulb = new THREE.Mesh(
  new THREE.SphereGeometry(2.1, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0xffe29a })
);
bulb.position.y = -26;
lampRig.add(bulb);
const halo = new THREE.Mesh(
  new THREE.SphereGeometry(7.2, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.12, depthWrite: false })
);
halo.position.y = -26;
lampRig.add(halo);

function woodTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#5a321c";
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) {
    const y = (i / 90) * 512 + Math.sin(i * 0.7) * 6;
    g.strokeStyle = `rgba(30,12,6,${0.08 + (i % 3) * 0.05})`;
    g.lineWidth = 2 + (i % 4);
    g.beginPath();
    g.moveTo(0, y);
    for (let x = 0; x <= 512; x += 16) g.lineTo(x, y + Math.sin(x * 0.04 + i) * 4);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function khokhlomaTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 1024;
  const g = c.getContext("2d");
  g.fillStyle = "#7a141c";
  g.fillRect(0, 0, 1024, 1024);
  g.strokeStyle = "#f3d48a";
  g.lineWidth = 22;
  g.beginPath();
  g.arc(512, 512, 470, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = "#e4b23c";
  g.lineWidth = 8;
  g.beginPath();
  g.arc(512, 512, 438, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = "#e4b23c";
  g.beginPath();
  g.arc(512, 512, 56, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#7a141c";
  g.beginPath();
  g.arc(512, 512, 28, 0, Math.PI * 2);
  g.fill();
  for (let i = 0; i < 20; i++) {
    const a0 = (i / 20) * Math.PI * 2;
    g.strokeStyle = i % 2 ? "#ffe08a" : "#e4b23c";
    g.lineWidth = 4;
    g.beginPath();
    for (let k = 0; k <= 24; k++) {
      const t = k / 24;
      const a = a0 + t * 1.4;
      const r = 110 + t * 290 + Math.sin(t * 10) * 20;
      const x = 512 + Math.cos(a) * r;
      const y = 512 + Math.sin(a) * r;
      if (k === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  }
  for (let i = 0; i < 80; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 70 + Math.random() * 360;
    const x = 512 + Math.cos(a) * r;
    const y = 512 + Math.sin(a) * r;
    g.fillStyle = Math.random() > 0.4 ? "#e53935" : "#43a047";
    g.beginPath();
    g.arc(x, y, 6 + Math.random() * 8, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function nightWindowTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 384;
  const g = c.getContext("2d");
  const sky = g.createLinearGradient(0, 0, 0, 384);
  sky.addColorStop(0, "#1a2848");
  sky.addColorStop(1, "#3a4a78");
  g.fillStyle = sky;
  g.fillRect(0, 0, 512, 384);
  g.fillStyle = "#f4e6c8";
  g.beginPath();
  g.arc(400, 70, 22, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#1a2848";
  g.beginPath();
  g.arc(412, 64, 16, 0, Math.PI * 2);
  g.fill();
  for (let i = 0; i < 80; i++) {
    g.fillStyle = `rgba(255,255,240,${0.35 + Math.random() * 0.6})`;
    g.fillRect(Math.random() * 512, Math.random() * 260, 1.5, 1.5);
  }
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * 512;
    const y = 220 + Math.random() * 164;
    g.fillStyle = "rgba(230,240,255,0.7)";
    g.fillRect(x, y, 1.2, 6 + Math.random() * 8);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function wallpaperTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#2c1014";
  g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 8; i++) {
    const x = i * 128;
    g.fillStyle = i % 2 ? "#3a1418" : "#281014";
    g.fillRect(x, 0, 128, 512);
    g.strokeStyle = "rgba(196,160,96,0.55)";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(x + 3, 0);
    g.lineTo(x + 3, 512);
    g.stroke();
    g.strokeStyle = "rgba(228,178,60,0.45)";
    g.lineWidth = 1.4;
    for (let y = 36; y < 500; y += 88) {
      g.beginPath();
      g.moveTo(x + 64, y);
      g.lineTo(x + 86, y + 22);
      g.lineTo(x + 64, y + 44);
      g.lineTo(x + 42, y + 22);
      g.closePath();
      g.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const woodMat = new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.72, metalness: 0.04 });
const table = new THREE.Mesh(new THREE.CylinderGeometry(78, 82, 5.2, 64), woodMat);
table.position.y = -2.6;
table.castShadow = true;
table.receiveShadow = true;
scene.add(table);

const tableRim = new THREE.Mesh(
  new THREE.TorusGeometry(80, 0.7, 8, 64),
  new THREE.MeshStandardMaterial({ color: 0xe4b23c, metalness: 0.72, roughness: 0.28 })
);
tableRim.rotation.x = Math.PI / 2;
tableRim.position.y = 0.04;
scene.add(tableRim);

const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(16, 22, 10, 24), woodMat);
pedestal.position.y = -10.2;
pedestal.castShadow = true;
scene.add(pedestal);
const plinth = new THREE.Mesh(new THREE.CylinderGeometry(26, 28, 3.2, 24), woodMat);
plinth.position.y = -13.8;
plinth.castShadow = true;
scene.add(plinth);
for (let i = 0; i < 4; i++) {
  const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 4.4, 13.6, 10), woodMat);
  leg.position.set(Math.cos(a) * 54, -10.4, Math.sin(a) * 54);
  leg.castShadow = true;
  scene.add(leg);
}

const floorTex = woodTexture();
floorTex.repeat.set(10, 10);
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(248, 80),
  new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.92, metalness: 0.02, color: 0x6a4630 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -15.4;
floor.receiveShadow = true;
scene.add(floor);

const rug = new THREE.Mesh(
  new THREE.CircleGeometry(118, 64),
  new THREE.MeshStandardMaterial({ color: 0x5a1418, roughness: 0.86, metalness: 0.04 })
);
rug.rotation.x = -Math.PI / 2;
rug.position.y = -15.28;
rug.receiveShadow = true;
scene.add(rug);
const rugRing = new THREE.Mesh(
  new THREE.RingGeometry(108, 116, 64),
  new THREE.MeshStandardMaterial({ color: 0xc4a060, roughness: 0.45, metalness: 0.35 })
);
rugRing.rotation.x = -Math.PI / 2;
rugRing.position.y = -15.2;
scene.add(rugRing);

const room = new THREE.Mesh(
  new THREE.CylinderGeometry(236, 236, 128, 48, 1, true),
  new THREE.MeshStandardMaterial({ map: wallpaperTexture(), roughness: 0.92, side: THREE.BackSide })
);
room.position.y = 48;
scene.add(room);

const ceiling = new THREE.Mesh(
  new THREE.CircleGeometry(238, 48),
  new THREE.MeshStandardMaterial({ color: 0x241210, roughness: 1 })
);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = 112;
scene.add(ceiling);

const wainscot = new THREE.Mesh(
  new THREE.CylinderGeometry(235.2, 235.2, 22, 48, 1, true),
  new THREE.MeshStandardMaterial({ color: 0x3a2218, roughness: 0.8, side: THREE.BackSide })
);
wainscot.position.y = -2;
scene.add(wainscot);
for (let i = 0; i < 5; i++) {
  const beam = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 5, 420),
    new THREE.MeshStandardMaterial({ color: 0x4a2a18, roughness: 0.9 })
  );
  beam.position.set(-70 + i * 36, 109, 0);
  scene.add(beam);
}

const winLight = new THREE.PointLight(0x88a6e0, 0.7, 200, 1.5);
winLight.position.set(18, 42, -170);
scene.add(winLight);
const windowPane = new THREE.Mesh(
  new THREE.PlaneGeometry(52, 40),
  new THREE.MeshBasicMaterial({ map: nightWindowTexture() })
);
windowPane.position.set(8, 44, -232);
scene.add(windowPane);
const windowFrame = new THREE.Mesh(
  new THREE.PlaneGeometry(58, 46),
  new THREE.MeshStandardMaterial({ color: 0x5a3218, roughness: 0.7 })
);
windowFrame.position.set(8, 44, -233.2);
scene.add(windowFrame);
const mullionV = new THREE.Mesh(
  new THREE.BoxGeometry(1.6, 40, 1.2),
  new THREE.MeshStandardMaterial({ color: 0xc4a060, metalness: 0.35, roughness: 0.45 })
);
mullionV.position.set(8, 44, -231.4);
scene.add(mullionV);
const mullionH = new THREE.Mesh(
  new THREE.BoxGeometry(52, 1.6, 1.2),
  new THREE.MeshStandardMaterial({ color: 0xc4a060, metalness: 0.35, roughness: 0.45 })
);
mullionH.position.set(8, 44, -231.4);
scene.add(mullionH);
for (const side of [-1, 1]) {
  const curtain = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 58),
    new THREE.MeshStandardMaterial({ color: 0x6b151c, roughness: 0.85, side: THREE.DoubleSide })
  );
  curtain.position.set(8 + side * 30, 38, -230);
  scene.add(curtain);
}

const icon = new THREE.Mesh(
  new THREE.PlaneGeometry(18, 24),
  new THREE.MeshStandardMaterial({ color: 0x3a1810, roughness: 0.55, metalness: 0.12 })
);
icon.position.set(-70, 40, -220);
icon.rotation.y = 0.18;
scene.add(icon);
const iconGold = new THREE.Mesh(
  new THREE.PlaneGeometry(14, 18),
  new THREE.MeshStandardMaterial({ color: 0xe4b23c, emissive: 0x4a3008, emissiveIntensity: 0.2, roughness: 0.4 })
);
iconGold.position.set(-70, 40, -219.6);
iconGold.rotation.y = 0.18;
scene.add(iconGold);

const cloth = new THREE.Mesh(
  new THREE.CircleGeometry(54, 72),
  new THREE.MeshStandardMaterial({ map: khokhlomaTexture(), roughness: 0.78, metalness: 0.08 })
);
cloth.rotation.x = -Math.PI / 2;
cloth.position.y = 0.08;
cloth.receiveShadow = true;
scene.add(cloth);

function addLathe(pts, color, metal, rough, y, x, z, sx = 1, sy = 1) {
  const mesh = new THREE.Mesh(
    new THREE.LatheGeometry(pts, 18),
    new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough })
  );
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sx);
  mesh.castShadow = true;
  scene.add(mesh);
  return mesh;
}
const brass = 0xc4a060;
addLathe([new THREE.Vector2(3.2, 0), new THREE.Vector2(5.4, 2), new THREE.Vector2(6.2, 6), new THREE.Vector2(4.2, 10), new THREE.Vector2(2.4, 13), new THREE.Vector2(3.6, 15)], brass, 0.78, 0.28, 0.2, -40, 10);
addLathe([new THREE.Vector2(0.8, 0), new THREE.Vector2(1.6, 2.2), new THREE.Vector2(0.5, 4.2)], brass, 0.78, 0.28, 15.2, -40, 10);
const spout = new THREE.Mesh(
  new THREE.TorusGeometry(5.2, 0.55, 8, 16, Math.PI * 1.1),
  new THREE.MeshStandardMaterial({ color: brass, metalness: 0.78, roughness: 0.28 })
);
spout.position.set(-36.2, 8.2, 10);
spout.rotation.z = Math.PI * 0.15;
spout.rotation.y = -0.4;
spout.castShadow = true;
scene.add(spout);
const handle = new THREE.Mesh(
  new THREE.TorusGeometry(3.4, 0.4, 8, 16, Math.PI),
  new THREE.MeshStandardMaterial({ color: brass, metalness: 0.78, roughness: 0.28 })
);
handle.position.set(-43.6, 9, 10);
handle.rotation.z = Math.PI * 0.5;
handle.castShadow = true;
scene.add(handle);
const cup = new THREE.Mesh(
  new THREE.CylinderGeometry(2.1, 1.7, 3.2, 14),
  new THREE.MeshStandardMaterial({ color: 0x8e1c24, roughness: 0.45, metalness: 0.08 })
);
cup.position.set(-30, 1.7, 16);
cup.castShadow = true;
scene.add(cup);
const saucer = new THREE.Mesh(
  new THREE.CylinderGeometry(3.2, 3.2, 0.35, 16),
  new THREE.MeshStandardMaterial({ color: 0xf3d48a, roughness: 0.4, metalness: 0.2 })
);
saucer.position.set(-30, 0.22, 16);
scene.add(saucer);

const dustGeo = new THREE.BufferGeometry();
const dustN = 560;
const dustPos = new Float32Array(dustN * 3);
for (let i = 0; i < dustN; i++) {
  dustPos[i * 3] = (Math.random() - 0.5) * 160;
  dustPos[i * 3 + 1] = Math.random() * 100;
  dustPos[i * 3 + 2] = (Math.random() - 0.5) * 160;
}
dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
const dust = new THREE.Points(
  dustGeo,
  new THREE.PointsMaterial({
    color: 0xffe6b8,
    size: 0.38,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    sizeAttenuation: true,
  })
);
scene.add(dust);

const SPARK_N = 90;
const sparkPos = new Float32Array(SPARK_N * 3);
for (let i = 0; i < SPARK_N; i++) sparkPos[i * 3 + 1] = -40;
const sparkGeo = new THREE.BufferGeometry();
sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
const sparks = new THREE.Points(
  sparkGeo,
  new THREE.PointsMaterial({
    color: 0xffe08a,
    size: 0.9,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    sizeAttenuation: true,
  })
);
scene.add(sparks);
const sparkLife = [];
function burstSparks(origin) {
  sparkLife.length = 0;
  for (let i = 0; i < SPARK_N; i++) {
    sparkLife.push({
      x: origin.x,
      y: origin.y,
      z: origin.z,
      vx: (Math.random() - 0.5) * 22,
      vy: 6 + Math.random() * 18,
      vz: (Math.random() - 0.5) * 22,
      age: 0,
      life: 0.45 + Math.random() * 0.55,
    });
  }
  sparks.material.opacity = 0.9;
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const dummy = new THREE.Object3D();
const tmpColor = new THREE.Color();
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const camGoal = HOME_CAM.clone();
const targetGoal = HOME_TARGET.clone();

let data = null;
let actors = [];
let selected = 0;
let dragging = null;
let dragOffset = new THREE.Vector3();
let pointerDown = null;
let busy = false;
let autoCam = false;
let muted = false;
const clock = new THREE.Clock();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const planeHit = new THREE.Vector3();

controls.addEventListener("start", () => { autoCam = false; });

const audio = {
  ctx: null,
  ensure() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  },
  blip(freq, dur, type, gain) {
    if (muted) return;
    const ctx = this.ensure();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.45), ctx.currentTime + dur);
    f.type = "lowpass";
    f.frequency.value = 1400;
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(f);
    f.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur + 0.02);
  },
  open() { this.blip(220, 0.14, "triangle", 0.09); },
  close() { this.blip(140, 0.11, "triangle", 0.08); },
  lift() { this.blip(320, 0.18, "sine", 0.05); },
  land() { this.blip(90, 0.16, "square", 0.045); },
  nest() { this.blip(180, 0.2, "triangle", 0.07); },
  chime(i) {
    const notes = [392, 440, 494, 587, 659];
    this.blip(notes[i % notes.length], 0.22, "sine", 0.04);
  },
};

function hexOf(palette, i) {
  return palette[i] || "#888888";
}

function makeInstanced(voxels, palette, origin, shiny) {
  const mesh = new THREE.InstancedMesh(
    boxGeo,
    new THREE.MeshStandardMaterial({
      roughness: shiny ? 0.28 : 0.62,
      metalness: shiny ? 0.55 : 0.04,
      envMapIntensity: shiny ? 0.85 : 0.28,
    }),
    voxels.length
  );
  const occ = new Set(voxels.map((v) => `${v[0]},${v[1]},${v[2]}`));
  voxels.forEach((v, i) => {
    dummy.position.set(v[0] - origin.x, v[1] - origin.y, v[2] - origin.z);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    let n = 0;
    for (const [dx, dy, dz] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]) {
      if (occ.has(`${v[0] + dx},${v[1] + dy},${v[2] + dz}`)) n++;
    }
    const ao = 0.7 + 0.3 * (1 - n / 6);
    tmpColor.set(hexOf(palette, v[3])).multiplyScalar(ao);
    mesh.setColorAt(i, tmpColor);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makePieces(voxels, palette, origin) {
  const g = new THREE.Group();
  if (!voxels.length) return g;
  const gold = voxels.filter((v) => GOLD_IDX.has(v[3]));
  const rest = voxels.filter((v) => !GOLD_IDX.has(v[3]));
  if (rest.length) g.add(makeInstanced(rest, palette, origin, false));
  if (gold.length) g.add(makeInstanced(gold, palette, origin, true));
  return g;
}

function hitProxy(w, h, d, y0, y1, part, index) {
  const geo = new THREE.CylinderGeometry(Math.max(w, d) * 0.42, Math.max(w, d) * 0.48, Math.max(2, y1 - y0), 12);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ visible: false }));
  mesh.position.y = (y0 + y1) / 2;
  mesh.userData = { part, index };
  return mesh;
}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
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
    this.nestLocal = nestLocal;
    this.origin = { x: (this.w - 1) / 2, y: 0, z: (this.d - 1) / 2 };

    this.group = new THREE.Group();
    this.baseGroup = new THREE.Group();
    this.lidPivot = new THREE.Group();
    this.lidGroup = new THREE.Group();
    this.group.add(this.baseGroup);
    this.lidPivot.position.y = this.splitY || this.h * 0.5;
    this.lidGroup.position.y = -(this.splitY || this.h * 0.5);
    this.lidPivot.add(this.lidGroup);
    this.group.add(this.lidPivot);

    this.baseGroup.add(makePieces(spec.base, palette, this.origin));
    this.lidGroup.add(makePieces(spec.lid, palette, this.origin));

    const lidMin = spec.hollow ? this.splitY : this.h;
    this.baseHit = hitProxy(this.w, this.h, this.d, 0, lidMin, "base", index);
    this.lidHit = hitProxy(this.w, this.h, this.d, lidMin, this.h, "lid", index);
    this.baseGroup.add(this.baseHit);
    this.lidGroup.add(this.lidHit);

    const blob = new THREE.Mesh(
      new THREE.CircleGeometry(Math.max(this.w, this.d) * 0.4, 24),
      new THREE.MeshBasicMaterial({ color: 0x100606, transparent: true, opacity: 0.38, depthWrite: false })
    );
    blob.rotation.x = -Math.PI / 2;
    blob.position.y = 0.06;
    this.group.add(blob);

    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(Math.max(this.w, this.d) * 0.44, Math.max(this.w, this.d) * 0.54, 28),
      new THREE.MeshBasicMaterial({ color: 0xe4b23c, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.13;
    this.group.add(this.ring);

    this.open = false;
    this.lidT = 0;
    this.lidGoal = 0;
    this.nestedIn = index > 0 ? index - 1 : null;
    this.pos = new THREE.Vector3();
    this.goal = new THREE.Vector3();
    this.yaw = HOME_YAW;
    this.goalYaw = HOME_YAW;
    this.flight = null;
    this.bounce = 0;
    scene.add(this.group);
  }

  worldPos() {
    if (this.nestedIn == null) return this.pos.clone();
    const parent = actors[this.nestedIn];
    const p = parent.worldPos();
    const off = this.nestLocal;
    p.x += off[0] + (this.w - parent.w) / 2;
    p.y += off[1] + parent.lidT * Math.min(8, parent.h * 0.14);
    p.z += off[2] + (this.d - parent.d) / 2;
    return p;
  }

  enclosed() {
    let id = this.nestedIn;
    while (id != null) {
      if (actors[id].lidT < 0.18) return true;
      id = actors[id].nestedIn;
    }
    return false;
  }
}

function lineupX(index) {
  const gap = 8;
  const widths = actors.map((a) => a.w);
  const total = widths.reduce((s, w) => s + w, 0) + gap * (actors.length - 1);
  let x = -total / 2;
  for (let i = 0; i < index; i++) x += widths[i] + gap;
  return x + widths[index] / 2;
}

function setStatus() {
  const a = actors[selected];
  const child = actors[selected + 1];
  let line = `${a.spec.nameRu} · ${a.spec.name}`;
  if (a.nestedIn != null) line += " — inside " + actors[a.nestedIn].spec.name;
  else if (a.open && child && child.nestedIn === a.index) line += " — open, " + child.spec.name + " is inside";
  else if (a.open) line += " — open";
  else line += " — on the table";
  statusEl.textContent = line;
  [...rosterEl.querySelectorAll("button")].forEach((b, i) => {
    b.classList.toggle("active", i === selected);
  });
}

function frameHome() {
  targetGoal.copy(HOME_TARGET);
  camGoal.copy(HOME_CAM);
  autoCam = true;
}

function frameVisible() {
  const vis = actors.filter((a) => a.nestedIn == null);
  if (!vis.length) return;
  let minx = Infinity, maxx = -Infinity, maxh = 0;
  vis.forEach((a) => {
    minx = Math.min(minx, a.goal.x - a.w * 0.5);
    maxx = Math.max(maxx, a.goal.x + a.w * 0.5);
    maxh = Math.max(maxh, a.h);
  });
  const cx = (minx + maxx) / 2;
  const span = Math.max(40, maxx - minx + 28);
  const dist = Math.max(200, span * 1.28 + maxh * 0.95);
  targetGoal.set(cx, Math.max(14, maxh * 0.34), 2);
  camGoal.set(cx + dist * 0.38, Math.max(46, maxh * 0.55 + 20), dist * 0.82);
  autoCam = true;
}

function flyTo(a, to, height = 16, dur = 0.55) {
  a.flight = {
    t: 0,
    dur,
    from: a.pos.clone(),
    to: to.clone(),
    height,
  };
  a.goal.copy(to);
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
    if (!p.open) return;
  }
  if (!a.open) audio.open();
  a.open = true;
  a.lidGoal = 1;
  selected = i;
  const p = a.worldPos();
  burstSparks(new THREE.Vector3(p.x, a.splitY + 4, p.z));
  setStatus();
}

function closeDoll(i) {
  const a = actors[i];
  if (a.open) audio.close();
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
  let slotX = p.x + parent.w * 0.55 + child.w * 0.55 + 7;
  actors.forEach((other) => {
    if (other === child || other.nestedIn != null) return;
    if (Math.abs(other.goal.x - slotX) < (other.w + child.w) * 0.5 + 5) {
      slotX = Math.max(slotX, other.goal.x + other.w * 0.5 + child.w * 0.5 + 7);
    }
  });
  audio.lift();
  flyTo(child, new THREE.Vector3(slotX, 0, 6), 14 + child.h * 0.12, 0.62);
  selected = i;
  setStatus();
}

function nestIntoParent(childIndex) {
  const child = actors[childIndex];
  if (childIndex === 0) return;
  const parent = actors[childIndex - 1];
  if (parent.nestedIn != null) return;
  if (!parent.open) openDoll(parent.index);
  const occupant = actors.find((a) => a.nestedIn === parent.index);
  if (occupant && occupant.index !== child.index) takeOut(occupant.index);
  audio.nest();
  child.open = false;
  child.lidGoal = 0;
  child.nestedIn = parent.index;
  selected = childIndex;
  setStatus();
}

function snapNested() {
  for (let i = actors.length - 1; i >= 1; i--) {
    actors[i].open = false;
    actors[i].lidGoal = 0;
    actors[i].lidT = 0;
    actors[i].nestedIn = i - 1;
    actors[i].flight = null;
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
    a.flight = null;
    flyTo(a, new THREE.Vector3(lineupX(i), 0, 0), 8, 0.7);
    a.goalYaw = HOME_YAW;
  });
  selected = 0;
  setStatus();
  frameVisible();
}

function takeNext() {
  const a = actors[selected];
  if (a.nestedIn != null) {
    const parent = actors[a.nestedIn];
    if (!parent.open) { openDoll(parent.index); return; }
    takeOut(a.index);
    return;
  }
  const child = actors[selected + 1];
  if (child && child.nestedIn === selected) {
    if (!a.open) { openDoll(selected); return; }
    takeOut(child.index);
    return;
  }
  const nested = actors.find((d) => d.nestedIn != null);
  if (!nested) return;
  const parent = actors[nested.nestedIn];
  if (!parent.open) openDoll(parent.index);
  else takeOut(nested.index);
}

function openNext() {
  const a = actors[selected];
  if (a.hollow && !a.open && (a.nestedIn == null || actors[a.nestedIn].open)) {
    openDoll(selected);
    return;
  }
  const closed = actors.find((d) => d.hollow && !d.open && (d.nestedIn == null || actors[d.nestedIn].open));
  if (closed) openDoll(closed.index);
  else takeNext();
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function unpackAll() {
  if (busy) return;
  busy = true;
  snapNested();
  actors[0].pos.set(0, 0, 0);
  frameHome();
  await wait(500);
  for (let i = 0; i < actors.length - 1; i++) {
    selected = i;
    openDoll(i);
    audio.chime(i);
    frameVisible();
    setStatus();
    await wait(680);
    takeOut(i + 1);
    flyTo(actors[i + 1], new THREE.Vector3(lineupX(i + 1), 0, 2), 15, 0.7);
    flyTo(actors[i], new THREE.Vector3(lineupX(i), 0, 0), 6, 0.7);
    frameVisible();
    await wait(780);
    closeDoll(i);
  }
  lineUp();
  busy = false;
}

async function packAll() {
  if (busy) return;
  busy = true;
  const free = actors.filter((a) => a.nestedIn == null);
  if (free.length <= 1) {
    snapNested();
    frameHome();
    busy = false;
    return;
  }
  for (let i = actors.length - 1; i >= 1; i--) {
    const child = actors[i];
    const parent = actors[i - 1];
    if (child.nestedIn != null) continue;
    if (parent.nestedIn != null) continue;
    openDoll(parent.index);
    await wait(420);
    const dest = parent.worldPos();
    dest.y += 8;
    flyTo(child, dest, 12, 0.55);
    await wait(560);
    child.nestedIn = parent.index;
    child.open = false;
    child.lidGoal = 0;
    audio.nest();
    closeDoll(parent.index);
    await wait(360);
  }
  actors.forEach((a) => {
    a.open = false;
    a.lidGoal = 0;
  });
  actors[0].goal.set(0, 0, 0);
  selected = 0;
  setStatus();
  frameHome();
  busy = false;
}

function buildRoster() {
  rosterEl.innerHTML = "";
  actors.forEach((a, i) => {
    const b = document.createElement("button");
    b.className = "doll-btn";
    b.innerHTML = `<span class="ru">${a.spec.nameRu}</span>${a.spec.name}`;
    b.addEventListener("click", () => {
      if (busy) return;
      audio.ensure();
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
    if (a.enclosed()) return;
    raycaster.intersectObjects([a.baseHit, a.lidHit], false).forEach((h) => hits.push(h));
  });
  hits.sort((a, b) => a.distance - b.distance);
  return hits[0] || null;
}

canvas.addEventListener("pointerdown", (e) => {
  audio.ensure();
  if (busy) return;
  const hit = pick(e);
  pointerDown = { x: e.clientX, y: e.clientY, hit };
  if (hit && e.button === 0) {
    const a = actors[hit.object.userData.index];
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
  const hover = pick(e);
  canvas.style.cursor = hover ? "pointer" : dragging ? "grabbing" : "grab";
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  if (raycaster.ray.intersectPlane(plane, planeHit)) {
    dragging.goal.set(planeHit.x + dragOffset.x, 0, planeHit.z + dragOffset.z);
    dragging.pos.y = 1.4;
  }
});

canvas.addEventListener("pointerup", (e) => {
  const moved = pointerDown && Math.hypot(e.clientX - pointerDown.x, e.clientY - pointerDown.y) > 8;
  const a = dragging;
  dragging = null;
  controls.enabled = true;
  if (a) a.goal.y = 0;
  if (busy) { pointerDown = null; return; }

  if (!moved && pointerDown?.hit) {
    const { index, part } = pointerDown.hit.object.userData;
    const doll = actors[index];
    selected = index;
    if (doll.nestedIn != null) takeOut(index);
    else if (part === "lid" && doll.open) closeDoll(index);
    else if (doll.hollow && !doll.open) openDoll(index);
    else if (doll.open) {
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
  if (busy) return;
  if (e.key === " ") { e.preventDefault(); unpackAll(); }
  if (e.key === "o" || e.key === "O") openNext();
  if (e.key === "t" || e.key === "T") takeNext();
  if (e.key === "n" || e.key === "N") packAll();
  if (e.key === "l" || e.key === "L") lineUp();
  if (e.key === "u" || e.key === "U") unpackAll();
  if (e.key === "m" || e.key === "M") toggleMute();
  if (e.key === "h" || e.key === "H") frameHome();
  if (e.key >= "1" && e.key <= "5") {
    selected = Number(e.key) - 1;
    setStatus();
  }
});

function toggleMute() {
  muted = !muted;
  const b = document.getElementById("btn-mute");
  if (b) b.textContent = muted ? "Sound off" : "Sound on";
  if (!muted) audio.ensure();
}

document.getElementById("btn-unpack").addEventListener("click", unpackAll);
document.getElementById("btn-open").addEventListener("click", () => { if (!busy) openNext(); });
document.getElementById("btn-take").addEventListener("click", () => { if (!busy) takeNext(); });
document.getElementById("btn-line").addEventListener("click", () => { if (!busy) lineUp(); });
document.getElementById("btn-nest").addEventListener("click", () => { if (!busy) packAll(); });
document.getElementById("btn-mute")?.addEventListener("click", toggleMute);

function updateActors(dt) {
  const t = clock.elapsedTime;
  const k = 1 - Math.exp(-dt * 10);
  const kLid = 1 - Math.exp(-dt * 7.5);
  actors.forEach((a) => {
    if (a.flight) {
      a.flight.t += dt / a.flight.dur;
      const u = Math.min(1, a.flight.t);
      const e = 1 - (1 - u) ** 3;
      a.pos.lerpVectors(a.flight.from, a.flight.to, e);
      a.pos.y = a.flight.from.y * (1 - e) + a.flight.to.y * e + Math.sin(u * Math.PI) * a.flight.height;
      if (u >= 1) {
        a.flight = null;
        a.pos.copy(a.goal);
        a.bounce = 1;
        audio.land();
      }
    } else if (a.nestedIn != null) {
      const wp = a.worldPos();
      a.pos.lerp(wp, k);
      a.goal.copy(wp);
    } else {
      a.pos.lerp(a.goal, k);
    }
    a.lidT += (a.lidGoal - a.lidT) * kLid;
    a.yaw += (a.goalYaw - a.yaw) * k;
    if (a.bounce > 0) a.bounce = Math.max(0, a.bounce - dt * 3.2);
    const squash = 1 - a.bounce * 0.06;
    a.group.position.copy(a.pos);
    a.group.position.y += a.bounce * 0.8;
    a.group.scale.set(1 / squash, squash, 1 / squash);
    a.group.rotation.y = a.yaw + (a.nestedIn == null && !a.open ? Math.sin(t * 0.55 + a.index) * 0.04 : 0);
    a.group.visible = !a.enclosed();
    const lift = a.lidGoal > a.lidT ? easeOutBack(Math.min(1, a.lidT)) : a.lidT;
    a.lidPivot.position.y = (a.splitY || a.h * 0.5) + lift * (11 + a.h * 0.17);
    a.lidPivot.position.z = lift * -2.8;
    a.lidPivot.rotation.x = lift * -0.98;
    const on = a.index === selected ? 0.9 : 0;
    a.ring.material.opacity += (on - a.ring.material.opacity) * (1 - Math.exp(-dt * 10));
  });
  const dp = dust.geometry.attributes.position.array;
  for (let i = 0; i < dustN; i++) {
    dp[i * 3 + 1] += dt * (0.6 + (i % 5) * 0.12);
    if (dp[i * 3 + 1] > 104) dp[i * 3 + 1] = 0;
    dp[i * 3] += Math.sin(t * 0.2 + i) * dt * 0.4;
  }
  dust.geometry.attributes.position.needsUpdate = true;
  if (sparkLife.length) {
    let alive = 0;
    for (let i = 0; i < sparkLife.length; i++) {
      const s = sparkLife[i];
      s.age += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.z += s.vz * dt;
      s.vy -= 28 * dt;
      const on = s.age < s.life;
      sparkPos[i * 3] = s.x;
      sparkPos[i * 3 + 1] = on ? s.y : -40;
      sparkPos[i * 3 + 2] = s.z;
      if (on) alive++;
    }
    sparks.geometry.attributes.position.needsUpdate = true;
    sparks.material.opacity = alive ? 0.85 : 0;
    if (!alive) sparkLife.length = 0;
  }
  halo.material.opacity = 0.1 + Math.sin(t * 1.6) * 0.04;
  lampRig.rotation.z = Math.sin(t * 0.48) * 0.028;
  lampRig.rotation.x = Math.sin(t * 0.33) * 0.012;
  if (autoCam) {
    const ck = 1 - Math.exp(-dt * 1.8);
    camera.position.lerp(camGoal, ck);
    controls.target.lerp(targetGoal, ck);
    camera.lookAt(controls.target);
  }
}

function onResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}
window.addEventListener("resize", onResize);

function tick() {
  const dt = Math.min(0.12, clock.getDelta());
  updateActors(dt);
  if (!autoCam) controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

async function main() {
  data = await fetch("models/dolls.json").then((r) => r.json());
  actors = data.dolls.map((spec, i) => {
    const nestLocal = i > 0 ? data.nestOffsets[i - 1] : [0, 0, 0];
    return new DollActor(i, spec, data.palette, nestLocal);
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
