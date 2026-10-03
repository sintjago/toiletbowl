import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { I18N } from "./i18n.js";

let lang = localStorage.getItem("matryoshka-lang") || "ru";
let currentSet = "sisters";
let currentRoom = "izba";
const setCache = {};

const canvas = document.getElementById("c");
const loading = document.getElementById("loading");
const statusEl = document.getElementById("status");
const rosterEl = document.getElementById("roster");
const GOLD_IDX = new Set([12, 13, 14]);

const PERSONAS = [
  {
    key: "matryona",
    role: "matriarch",
    line: "keeps every daughter under her scarf",
    quotes: {
      table: "keeping watch over the cloth",
      open: "opening the house, unhurried",
      inside: "holding them all, as she always has",
      peek: "letting the next one see the lamp",
    },
    ring: 0xe4b23c,
    aura: 0xc62828,
    auraSize: 1.05,
    motion: "regal",
    glance: "daughters",
    glanceEvery: [4.2, 7.0],
    flightH: 11,
    flightDur: 0.86,
    flightSpin: 0,
    lid: { h: 13, z: -2.1, pitch: -0.72, yaw: 0, twist: 0, speed: 4.4 },
    notes: { open: 174, close: 96, lift: 196, land: 62, nest: 148, chime: 196, giggle: 220, type: "triangle", gain: 0.08 },
  },
  {
    key: "darya",
    role: "frost singer",
    line: "skates the cloth like a frozen lake",
    quotes: {
      table: "gliding, cool as the night pane",
      open: "a quiet crack of winter wood",
      inside: "asleep in the blue dark",
      peek: "frost on her scarf, listening",
    },
    ring: 0x82b1ff,
    aura: 0xe8f4ff,
    auraSize: 0.85,
    motion: "glide",
    glance: "window",
    glanceEvery: [3.0, 5.2],
    flightH: 9,
    flightDur: 0.92,
    flightSpin: 0.2,
    lid: { h: 10, z: -4.4, pitch: -0.5, yaw: 0.2, twist: 0.12, speed: 6.2 },
    notes: { open: 620, close: 340, lift: 710, land: 260, nest: 480, chime: 784, giggle: 880, type: "sine", gain: 0.055 },
  },
  {
    key: "olga",
    role: "sunflower",
    line: "turns her face to the lamp as if it were July",
    quotes: {
      table: "beaming at the hanging sun",
      open: "bright as a field in July",
      inside: "dreaming of warm light",
      peek: "already leaning toward the lamp",
    },
    ring: 0xf9a825,
    aura: 0xffe082,
    auraSize: 0.95,
    motion: "sunny",
    glance: "lamp",
    glanceEvery: [1.8, 3.4],
    flightH: 17,
    flightDur: 0.56,
    flightSpin: 0,
    lid: { h: 12, z: -2.0, pitch: -1.12, yaw: 0, twist: 0, speed: 8.4 },
    notes: { open: 392, close: 247, lift: 523, land: 196, nest: 330, chime: 523, giggle: 659, type: "triangle", gain: 0.07 },
  },
  {
    key: "natasha",
    role: "berry tease",
    line: "cannot keep still — not even for a portrait",
    quotes: {
      table: "fidgeting, plotting the next hop",
      open: "already halfway out of herself",
      inside: "tapping the wood from inside",
      peek: "peeks, then hides, then peeks",
    },
    ring: 0xec407a,
    aura: 0xff8a80,
    auraSize: 0.8,
    motion: "fidget",
    glance: "sisters",
    glanceEvery: [0.7, 1.5],
    flightH: 16,
    flightDur: 0.48,
    flightSpin: 1.35,
    lid: { h: 9, z: -3.6, pitch: -1.28, yaw: 0.85, twist: 0.55, speed: 11.5 },
    notes: { open: 740, close: 420, lift: 880, land: 300, nest: 560, chime: 880, giggle: 990, type: "square", gain: 0.035 },
  },
  {
    key: "masha",
    role: "baby",
    line: "too small to open, too lively to sit",
    quotes: {
      table: "bouncing — the whole table is a drum",
      open: "giggles instead of opening",
      inside: "a raspberry seed in the dark",
      peek: "waving from the cup",
    },
    ring: 0xf8bbd0,
    aura: 0xff80ab,
    auraSize: 0.7,
    motion: "wobble",
    glance: "camera",
    glanceEvery: [1.0, 2.0],
    flightH: 20,
    flightDur: 0.44,
    flightSpin: 2.1,
    lid: { h: 6, z: 0, pitch: 0, yaw: 0, twist: 0, speed: 8 },
    notes: { open: 880, close: 660, lift: 990, land: 440, nest: 770, chime: 1046, giggle: 1174, type: "sine", gain: 0.05 },
  },
];

const HUSBAND_PERSONAS = [
  {
    key: "ivan",
    ring: 0xe4b23c,
    aura: 0x8d6e4c,
    auraSize: 1.0,
    motion: "regal",
    glance: "daughters",
    glanceEvery: [4.0, 6.5],
    flightH: 10,
    flightDur: 0.88,
    flightSpin: 0,
    lid: { h: 13, z: -2.0, pitch: -0.7, yaw: 0, twist: 0, speed: 4.2 },
    notes: { open: 140, close: 80, lift: 168, land: 52, nest: 120, chime: 165, giggle: 196, type: "triangle", gain: 0.085 },
  },
  {
    key: "pavel",
    ring: 0x82b1ff,
    aura: 0xbbdefb,
    auraSize: 0.85,
    motion: "glide",
    glance: "window",
    glanceEvery: [2.6, 4.8],
    flightH: 9,
    flightDur: 0.9,
    flightSpin: 0.25,
    lid: { h: 10, z: -4.2, pitch: -0.48, yaw: 0.18, twist: 0.1, speed: 6.0 },
    notes: { open: 540, close: 300, lift: 640, land: 220, nest: 420, chime: 698, giggle: 784, type: "sine", gain: 0.05 },
  },
  {
    key: "boris",
    ring: 0x8bc34a,
    aura: 0xc5e1a5,
    auraSize: 0.95,
    motion: "sunny",
    glance: "lamp",
    glanceEvery: [1.6, 3.0],
    flightH: 15,
    flightDur: 0.6,
    flightSpin: 0,
    lid: { h: 11, z: -2.2, pitch: -1.05, yaw: 0, twist: 0, speed: 7.6 },
    notes: { open: 220, close: 130, lift: 280, land: 90, nest: 180, chime: 247, giggle: 330, type: "triangle", gain: 0.075 },
  },
  {
    key: "yuri",
    ring: 0xffb74d,
    aura: 0xffcc80,
    auraSize: 0.8,
    motion: "fidget",
    glance: "sisters",
    glanceEvery: [0.6, 1.4],
    flightH: 16,
    flightDur: 0.46,
    flightSpin: 1.4,
    lid: { h: 9, z: -3.4, pitch: -1.2, yaw: 0.8, twist: 0.5, speed: 11 },
    notes: { open: 700, close: 400, lift: 840, land: 280, nest: 520, chime: 830, giggle: 940, type: "square", gain: 0.035 },
  },
  {
    key: "kolya",
    ring: 0x90caf9,
    aura: 0x81d4fa,
    auraSize: 0.7,
    motion: "wobble",
    glance: "camera",
    glanceEvery: [0.9, 1.8],
    flightH: 20,
    flightDur: 0.42,
    flightSpin: 2.2,
    lid: { h: 6, z: 0, pitch: 0, yaw: 0, twist: 0, speed: 8 },
    notes: { open: 860, close: 640, lift: 960, land: 420, nest: 740, chime: 990, giggle: 1120, type: "sine", gain: 0.05 },
  },
];

function personaOf(i) {
  const list = currentSet === "husbands" ? HUSBAND_PERSONAS : PERSONAS;
  return list[i] || list[0];
}

function tr(key) {
  const parts = key.split(".");
  let cur = I18N[lang];
  for (const p of parts) cur = cur?.[p];
  return cur ?? key;
}

function personaRole(i) {
  return I18N[lang].roles[personaOf(i).key] || "";
}

function personaQuote(i, field) {
  return I18N[lang].quotes[personaOf(i).key]?.[field] || "";
}

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
const beams = [];
for (let i = 0; i < 5; i++) {
  const beam = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 5, 420),
    new THREE.MeshStandardMaterial({ color: 0x4a2a18, roughness: 0.9 })
  );
  beam.position.set(-70 + i * 36, 109, 0);
  scene.add(beam);
  beams.push(beam);
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
const curtains = [];
for (const side of [-1, 1]) {
  const curtain = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 58),
    new THREE.MeshStandardMaterial({ color: 0x6b151c, roughness: 0.85, side: THREE.DoubleSide })
  );
  curtain.position.set(8 + side * 30, 38, -230);
  scene.add(curtain);
  curtains.push(curtain);
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
const samovarBody = addLathe([new THREE.Vector2(3.2, 0), new THREE.Vector2(5.4, 2), new THREE.Vector2(6.2, 6), new THREE.Vector2(4.2, 10), new THREE.Vector2(2.4, 13), new THREE.Vector2(3.6, 15)], brass, 0.78, 0.28, 0.2, -40, 10);
const samovarTop = addLathe([new THREE.Vector2(0.8, 0), new THREE.Vector2(1.6, 2.2), new THREE.Vector2(0.5, 4.2)], brass, 0.78, 0.28, 15.2, -40, 10);
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

const meadowGroup = new THREE.Group();
meadowGroup.visible = false;
scene.add(meadowGroup);
function grassTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#3d6b28";
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 400; i++) {
    g.strokeStyle = i % 2 ? "#4e8a32" : "#2d541c";
    g.beginPath();
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    g.moveTo(x, y);
    g.lineTo(x + (Math.random() - 0.5) * 6, y - 8 - Math.random() * 10);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const grass = new THREE.Mesh(
  new THREE.CircleGeometry(248, 72),
  new THREE.MeshStandardMaterial({ map: grassTexture(), roughness: 0.95 })
);
grass.rotation.x = -Math.PI / 2;
grass.position.y = -15.2;
meadowGroup.add(grass);
for (let i = 0; i < 6; i++) {
  const a = (i / 6) * Math.PI * 2 + 0.4;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 3.4, 48, 8),
    new THREE.MeshStandardMaterial({ color: 0xe8dcc8, roughness: 0.8 })
  );
  trunk.position.set(Math.cos(a) * 150, 8, Math.sin(a) * 150);
  meadowGroup.add(trunk);
  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(16, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.85 })
  );
  leaves.position.set(trunk.position.x, 36, trunk.position.z);
  meadowGroup.add(leaves);
}
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(10, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0xffe082 })
);
sun.position.set(-90, 88, -160);
meadowGroup.add(sun);
const sunGlow = new THREE.Mesh(
  new THREE.SphereGeometry(16, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0xfff59d, transparent: true, opacity: 0.22, depthWrite: false })
);
sunGlow.position.copy(sun.position);
meadowGroup.add(sunGlow);
for (let i = 0; i < 18; i++) {
  const flower = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 8, 8),
    new THREE.MeshStandardMaterial({ color: i % 3 ? 0xe53935 : 0xf9a825, roughness: 0.6 })
  );
  const a = (i / 18) * Math.PI * 2;
  const r = 90 + (i % 5) * 14;
  flower.position.set(Math.cos(a) * r, -14.2, Math.sin(a) * r);
  meadowGroup.add(flower);
}

const winterGroup = new THREE.Group();
winterGroup.visible = false;
scene.add(winterGroup);
const snowFloor = new THREE.Mesh(
  new THREE.CircleGeometry(248, 72),
  new THREE.MeshStandardMaterial({ color: 0xe8eef6, roughness: 0.95 })
);
snowFloor.rotation.x = -Math.PI / 2;
snowFloor.position.y = -15.15;
winterGroup.add(snowFloor);
for (let i = 0; i < 8; i++) {
  const drift = new THREE.Mesh(
    new THREE.SphereGeometry(10 + (i % 3) * 4, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xf4f7fb, roughness: 1 })
  );
  const a = (i / 8) * Math.PI * 2;
  drift.position.set(Math.cos(a) * 130, -10, Math.sin(a) * 130);
  drift.scale.y = 0.35;
  winterGroup.add(drift);
}
const moon = new THREE.Mesh(
  new THREE.SphereGeometry(8, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0xf4f7fb })
);
moon.position.set(70, 92, -150);
winterGroup.add(moon);
const moonLight = new THREE.PointLight(0xb3e5fc, 0.85, 280, 1.4);
moonLight.position.copy(moon.position);
winterGroup.add(moonLight);
for (let i = 0; i < 7; i++) {
  const a = (i / 7) * Math.PI * 2 + 0.2;
  const pine = new THREE.Mesh(
    new THREE.ConeGeometry(10 + (i % 3) * 3, 28 + (i % 2) * 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.92 })
  );
  pine.position.set(Math.cos(a) * 168, 2, Math.sin(a) * 168);
  winterGroup.add(pine);
}
const snowGeo = new THREE.BufferGeometry();
const snowN = 420;
const snowPos = new Float32Array(snowN * 3);
for (let i = 0; i < snowN; i++) {
  snowPos[i * 3] = (Math.random() - 0.5) * 220;
  snowPos[i * 3 + 1] = Math.random() * 110;
  snowPos[i * 3 + 2] = (Math.random() - 0.5) * 220;
}
snowGeo.setAttribute("position", new THREE.BufferAttribute(snowPos, 3));
const snowfall = new THREE.Points(
  snowGeo,
  new THREE.PointsMaterial({
    color: 0xf8fbff,
    size: 0.7,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    sizeAttenuation: true,
  })
);
winterGroup.add(snowfall);

const teremGroup = new THREE.Group();
teremGroup.visible = false;
scene.add(teremGroup);
for (let i = 0; i < 3; i++) {
  const candle = new THREE.PointLight(0xffc878, 0.55, 80, 1.6);
  candle.position.set(-50 + i * 48, 36, -40);
  teremGroup.add(candle);
  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffe08a })
  );
  flame.position.copy(candle.position);
  teremGroup.add(flame);
}

const clothMaps = {
  izba: cloth.material.map,
  winter: (() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const g = c.getContext("2d");
    g.fillStyle = "#dce6f2";
    g.fillRect(0, 0, 512, 512);
    g.strokeStyle = "#90caf9";
    g.lineWidth = 8;
    g.beginPath();
    g.arc(256, 256, 220, 0, Math.PI * 2);
    g.stroke();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      g.strokeStyle = "#e3f2fd";
      g.beginPath();
      g.moveTo(256, 256);
      g.lineTo(256 + Math.cos(a) * 200, 256 + Math.sin(a) * 200);
      g.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })(),
  meadow: (() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const g = c.getContext("2d");
    g.fillStyle = "#f4e6c8";
    g.fillRect(0, 0, 512, 512);
    g.strokeStyle = "#43a047";
    g.lineWidth = 10;
    g.beginPath();
    g.arc(256, 256, 210, 0, Math.PI * 2);
    g.stroke();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      g.fillStyle = i % 2 ? "#e53935" : "#f9a825";
      g.beginPath();
      g.arc(256 + Math.cos(a) * 140, 256 + Math.sin(a) * 140, 10, 0, Math.PI * 2);
      g.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })(),
  terem: (() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const g = c.getContext("2d");
    g.fillStyle = "#4a1018";
    g.fillRect(0, 0, 512, 512);
    g.strokeStyle = "#e4b23c";
    g.lineWidth = 16;
    g.beginPath();
    g.arc(256, 256, 220, 0, Math.PI * 2);
    g.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.fillStyle = i % 2 ? "#f3d48a" : "#c9a227";
      g.beginPath();
      g.arc(256 + Math.cos(a) * 150, 256 + Math.sin(a) * 150, 14, 0, Math.PI * 2);
      g.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })(),
};

function goldWallpaperTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#3a1014";
  g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 8; i++) {
    const x = i * 128;
    g.fillStyle = i % 2 ? "#5a181c" : "#3a1014";
    g.fillRect(x, 0, 128, 512);
    g.strokeStyle = "rgba(228,178,60,0.75)";
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(x + 4, 0);
    g.lineTo(x + 4, 512);
    g.stroke();
    g.strokeStyle = "rgba(243,212,138,0.7)";
    g.lineWidth = 1.6;
    for (let y = 28; y < 500; y += 72) {
      g.beginPath();
      g.moveTo(x + 64, y);
      g.lineTo(x + 92, y + 20);
      g.lineTo(x + 64, y + 40);
      g.lineTo(x + 36, y + 20);
      g.closePath();
      g.stroke();
      g.beginPath();
      g.arc(x + 64, y + 20, 5, 0, Math.PI * 2);
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
const wallpaperIzba = room.material.map;
const wallpaperTerem = goldWallpaperTexture();

const indoorDecor = [room, ceiling, wainscot, windowPane, windowFrame, mullionV, mullionH, icon, iconGold, ...beams, ...curtains];
const teaSet = [samovarBody, samovarTop, spout, handle, cup, saucer];

function applyRoom(id) {
  currentRoom = id;
  const outdoor = id === "meadow" || id === "winter";
  meadowGroup.visible = id === "meadow";
  winterGroup.visible = id === "winter";
  teremGroup.visible = id === "terem";
  indoorDecor.forEach((o) => { o.visible = !outdoor; });
  lampRig.visible = !outdoor;
  teaSet.forEach((o) => { o.visible = id === "izba" || id === "terem"; });
  rug.visible = id === "izba" || id === "terem";
  rugRing.visible = id === "izba" || id === "terem";
  cloth.material.map = clothMaps[id] || clothMaps.izba;
  cloth.material.needsUpdate = true;
  room.material.map = id === "terem" ? wallpaperTerem : wallpaperIzba;
  room.material.needsUpdate = true;
  if (id === "izba") {
    scene.background.set(0x100608);
    scene.fog.color.set(0x100608);
    scene.fog.density = 0.0024;
    floor.material.color.set(0x6a4630);
    winLight.color.set(0x88a6e0);
    winLight.intensity = 0.7;
    key.intensity = 0.7;
    fill.color.set(0x6a80c0);
    fill.intensity = 0.16;
    rim.intensity = 0.28;
    dust.material.color.set(0xffe6b8);
    dust.material.opacity = 0.22;
  } else if (id === "winter") {
    scene.background.set(0x0d1a2c);
    scene.fog.color.set(0x0d1a2c);
    scene.fog.density = 0.0022;
    floor.material.color.set(0xcfd8dc);
    winLight.intensity = 0;
    key.intensity = 0.72;
    fill.color.set(0x90caf9);
    fill.intensity = 0.34;
    rim.intensity = 0.42;
    dust.material.color.set(0xe3f2fd);
    dust.material.opacity = 0.08;
  } else if (id === "meadow") {
    scene.background.set(0x87b5d9);
    scene.fog.color.set(0x87b5d9);
    scene.fog.density = 0.0012;
    floor.material.color.set(0x4e8a32);
    winLight.intensity = 0;
    key.intensity = 1.08;
    fill.color.set(0xfff8e1);
    fill.intensity = 0.38;
    rim.intensity = 0.36;
    dust.material.color.set(0xfff9c4);
    dust.material.opacity = 0.16;
  } else {
    scene.background.set(0x1a0c14);
    scene.fog.color.set(0x1a0c14);
    scene.fog.density = 0.002;
    floor.material.color.set(0x5a3824);
    winLight.color.set(0xffd54f);
    winLight.intensity = 0.95;
    key.intensity = 0.88;
    fill.color.set(0xc9a227);
    fill.intensity = 0.2;
    rim.intensity = 0.34;
    dust.material.color.set(0xffe082);
    dust.material.opacity = 0.24;
  }
  buildChoosers();
}

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
function burstSparks(origin, color) {
  if (color) sparks.material.color.set(color);
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
  voice(i, kind) {
    if (muted) return;
    const n = personaOf(i).notes;
    const freq = n[kind] || n.chime;
    const dur = kind === "giggle" ? 0.09 : kind === "land" ? 0.14 : 0.16;
    this.blip(freq, dur, n.type, n.gain);
    if (kind === "giggle" || kind === "chime") {
      const ctx = this.ensure();
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(freq * 1.5, t + 0.07);
      g.gain.setValueAtTime(n.gain * 0.7, t + 0.07);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t + 0.07);
      o.stop(t + 0.22);
    }
  },
  open(i) { this.voice(i ?? 0, "open"); },
  close(i) { this.voice(i ?? 0, "close"); },
  lift(i) { this.voice(i ?? 0, "lift"); },
  land(i) { this.voice(i ?? 0, "land"); },
  nest(i) { this.voice(i ?? 0, "nest"); },
  chime(i) { this.voice(i ?? 0, "chime"); },
  giggle(i) { this.voice(i ?? 4, "giggle"); },
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

function makeAura(index) {
  const n = 42;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3);
  const ages = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    ages[i] = Math.random();
    pos[i * 3 + 1] = -20;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: personaOf(index).aura,
      size: personaOf(index).auraSize,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      sizeAttenuation: true,
    })
  );
  pts.frustumCulled = false;
  return { pts, n, ages, pos };
}

function yawToward(from, target) {
  return Math.atan2(target.x - from.x, target.z - from.z);
}

function pickGlance(a) {
  const p = personaOf(a.index);
  if (p.glance === "window") return yawToward(a.pos, new THREE.Vector3(8, 0, -220));
  if (p.glance === "lamp") return yawToward(a.pos, new THREE.Vector3(-8, 0, 14));
  if (p.glance === "camera") return HOME_YAW + (Math.random() - 0.5) * 0.35;
  if (p.glance === "sisters") {
    const others = actors.filter((o) => o !== a && o.nestedIn == null && !o.enclosed());
    if (others.length) {
      const t = others[Math.floor(Math.random() * others.length)];
      return yawToward(a.pos, t.pos);
    }
  }
  if (p.glance === "daughters") {
    const kids = actors.filter((o) => o.index > a.index && o.nestedIn == null);
    if (kids.length) return yawToward(a.pos, kids[0].pos);
  }
  return HOME_YAW;
}

function wake(a) {
  const p = personaOf(a.index);
  a.flourish = { t: 0, dur: 0.72 + a.index * 0.04, kind: p.motion };
  a.glanceT = 0.4;
  audio.chime(a.index);
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

    const persona = personaOf(index);
    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(Math.max(this.w, this.d) * 0.44, Math.max(this.w, this.d) * 0.54, 28),
      new THREE.MeshBasicMaterial({ color: persona.ring, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.13;
    this.group.add(this.ring);

    this.aura = makeAura(index);
    this.group.add(this.aura.pts);

    this.open = false;
    this.lidT = 0;
    this.lidGoal = 0;
    this.nestedIn = index > 0 ? index - 1 : null;
    this.pos = new THREE.Vector3();
    this.goal = new THREE.Vector3();
    this.yaw = HOME_YAW;
    this.goalYaw = HOME_YAW;
    this.pitch = 0;
    this.roll = 0;
    this.flight = null;
    this.bounce = 0;
    this.alive = index === 0 ? 0.55 : 0;
    this.glanceT = 1.5 + index * 0.4;
    this.flourish = null;
    this.hopPhase = Math.random() * Math.PI * 2;
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
  let flavor = personaQuote(a.index, "table");
  if (a.nestedIn != null) flavor = personaQuote(a.index, "inside");
  else if (a.open && child && child.nestedIn === a.index) flavor = personaQuote(a.index, "peek");
  else if (a.open) flavor = personaQuote(a.index, "open");
  const shown = lang === "ru" ? a.spec.nameRu : a.spec.name;
  statusEl.textContent = `${shown} · ${personaRole(a.index)} — ${flavor}`;
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

function flyTo(a, to, height, dur) {
  const p = personaOf(a.index);
  a.flight = {
    t: 0,
    dur: dur ?? p.flightDur,
    from: a.pos.clone(),
    to: to.clone(),
    height: height ?? p.flightH,
    spin: p.flightSpin,
  };
  a.goal.copy(to);
}

function openDoll(i) {
  const a = actors[i];
  if (!a.hollow) {
    selected = i;
    a.bounce = 1.35;
    a.flourish = { t: 0, dur: 0.7, kind: "wobble" };
    audio.giggle(i);
    setStatus();
    return;
  }
  if (a.nestedIn != null) {
    const p = actors[a.nestedIn];
    if (!p.open) openDoll(a.nestedIn);
    if (!p.open) return;
  }
  if (!a.open) audio.open(i);
  a.open = true;
  a.lidGoal = 1;
  selected = i;
  const p = a.worldPos();
  burstSparks(new THREE.Vector3(p.x, a.splitY + 4, p.z), personaOf(i).aura);
  setStatus();
}

function closeDoll(i) {
  const a = actors[i];
  if (a.open) audio.close(i);
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
  audio.lift(i);
  flyTo(child, new THREE.Vector3(slotX, 0, 6));
  wake(child);
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
  audio.nest(childIndex);
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
    flyTo(a, new THREE.Vector3(lineupX(i), 0, 0));
    a.goalYaw = HOME_YAW;
    a.flourish = { t: -0.2 - i * 0.16, dur: 0.78, kind: personaOf(i).motion };
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
    flyTo(actors[i + 1], new THREE.Vector3(lineupX(i + 1), 0, 2));
    flyTo(actors[i], new THREE.Vector3(lineupX(i), 0, 0));
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
    audio.nest(i);
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
    const p = personaOf(i);
    b.className = `doll-btn persona-${p.key}`;
    const shown = lang === "ru" ? a.spec.nameRu : a.spec.name;
    const other = lang === "ru" ? a.spec.name : a.spec.nameRu;
    b.innerHTML = `<span class="ru">${shown}</span>${other}<span class="role">${personaRole(i)}</span>`;
    b.addEventListener("click", () => {
      if (busy) return;
      audio.ensure();
      selected = i;
      if (a.nestedIn != null) {
        const p = actors[a.nestedIn];
        if (!p.open) openDoll(p.index);
        else takeOut(i);
      } else if (!a.hollow) openDoll(i);
      else if (a.hollow && !a.open) openDoll(i);
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
  if (b) b.textContent = muted ? tr("soundOff") : tr("soundOn");
  if (!muted) audio.ensure();
}

document.getElementById("btn-unpack").addEventListener("click", unpackAll);
document.getElementById("btn-open").addEventListener("click", () => { if (!busy) openNext(); });
document.getElementById("btn-take").addEventListener("click", () => { if (!busy) takeNext(); });
document.getElementById("btn-line").addEventListener("click", () => { if (!busy) lineUp(); });
document.getElementById("btn-nest").addEventListener("click", () => { if (!busy) packAll(); });
document.getElementById("btn-mute")?.addEventListener("click", toggleMute);
document.getElementById("btn-lang-ru")?.addEventListener("click", () => setLang("ru"));
document.getElementById("btn-lang-en")?.addEventListener("click", () => setLang("en"));

function applyLang() {
  document.documentElement.lang = lang;
  const title = document.getElementById("ui-title");
  if (title) title.innerHTML = `${tr("title")}<span id="ui-subtitle">${tr("subtitle")}</span>`;
  const blurb = document.getElementById("ui-blurb");
  if (blurb) blurb.textContent = I18N[lang].blurb[currentSet];
  const hint = document.getElementById("ui-hint");
  if (hint) hint.textContent = I18N[lang].hint[currentSet];
  const map = [
    ["btn-unpack", "unpack"],
    ["btn-open", "open"],
    ["btn-take", "take"],
    ["btn-line", "line"],
    ["btn-nest", "nest"],
  ];
  map.forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = tr(key);
  });
  const mute = document.getElementById("btn-mute");
  if (mute) mute.textContent = muted ? tr("soundOff") : tr("soundOn");
  document.getElementById("btn-lang-ru")?.classList.toggle("active", lang === "ru");
  document.getElementById("btn-lang-en")?.classList.toggle("active", lang === "en");
  document.title = `${tr("title")} — ${tr("subtitle")}`;
  if (document.getElementById("loading") && !document.getElementById("loading").hidden) {
    document.getElementById("loading").textContent = tr("loading");
  }
  buildChoosers();
  if (actors.length) {
    buildRoster();
    setStatus();
  }
}

function buildChoosers() {
  const setEl = document.getElementById("set-picker");
  const roomEl = document.getElementById("room-picker");
  if (!setEl || !roomEl) return;
  setEl.innerHTML = "";
  const setLab = document.createElement("span");
  setLab.className = "chooser-label";
  setLab.textContent = tr("setLabel");
  setEl.appendChild(setLab);
  [["sisters", tr("sisters")], ["husbands", tr("husbands")]].forEach(([id, label]) => {
    const b = document.createElement("button");
    b.textContent = label;
    if (id === currentSet) b.classList.add("active");
    else b.classList.add("ghost");
    b.addEventListener("click", () => { if (!busy) loadSet(id); });
    setEl.appendChild(b);
  });
  roomEl.innerHTML = "";
  const roomLab = document.createElement("span");
  roomLab.className = "chooser-label";
  roomLab.textContent = tr("roomLabel");
  roomEl.appendChild(roomLab);
  ["izba", "winter", "meadow", "terem"].forEach((id) => {
    const b = document.createElement("button");
    b.textContent = I18N[lang].rooms[id];
    if (id === currentRoom) b.classList.add("active");
    else b.classList.add("ghost");
    b.addEventListener("click", () => applyRoom(id));
    roomEl.appendChild(b);
  });
}

function clearActors() {
  actors.forEach((a) => {
    a.group.traverse((o) => {
      if (o.isInstancedMesh && o.material) o.material.dispose();
    });
    scene.remove(a.group);
  });
  actors = [];
}

function spawnActors(pack) {
  data = pack;
  actors = pack.dolls.map((spec, i) => {
    const nestLocal = i > 0 ? pack.nestOffsets[i - 1] : [0, 0, 0];
    return new DollActor(i, spec, pack.palette, nestLocal);
  });
  actors[0].pos.set(0, 0, 0);
  actors[0].goal.set(0, 0, 0);
  for (let i = 1; i < actors.length; i++) {
    actors[i].nestedIn = i - 1;
    actors[i].pos.copy(actors[i].worldPos());
    actors[i].goal.copy(actors[i].pos);
  }
  selected = 0;
  actors[0].flourish = { t: -0.4, dur: 1.0, kind: personaOf(0).motion };
}

async function loadSet(id) {
  if (busy) return;
  if (id === currentSet && actors.length) return;
  busy = true;
  try {
    currentSet = id;
    if (!setCache[id]) {
      const file = id === "husbands" ? "models/husbands.json" : "models/dolls.json";
      setCache[id] = await fetch(file).then((r) => r.json());
    }
    clearActors();
    spawnActors(setCache[id]);
    applyLang();
  } finally {
    busy = false;
  }
}

function setLang(next) {
  lang = next;
  localStorage.setItem("matryoshka-lang", lang);
  applyLang();
}

function updateAura(a, dt) {
  const live = a.alive;
  const motion = personaOf(a.index).motion;
  a.aura.pts.material.opacity = live * (a.enclosed() ? 0 : 0.62);
  const pos = a.aura.pos;
  const ages = a.aura.ages;
  const n = a.aura.n;
  const r0 = Math.max(a.w, a.d) * 0.42;
  for (let i = 0; i < n; i++) {
    ages[i] += dt * (0.35 + (i % 5) * 0.08);
    if (ages[i] > 1) ages[i] -= 1;
    const u = ages[i];
    const ang = (i / n) * Math.PI * 2 + clock.elapsedTime * 0.4;
    if (motion === "regal") {
      pos[i * 3] = Math.cos(ang) * (r0 + 2 + u * 4);
      pos[i * 3 + 2] = Math.sin(ang) * (r0 + 2 + u * 4);
      pos[i * 3 + 1] = a.h * (1.05 - u * 1.15);
    } else if (motion === "glide") {
      pos[i * 3] = Math.cos(ang + u * 2) * (r0 + u * 6);
      pos[i * 3 + 2] = Math.sin(ang + u * 2) * (r0 + u * 6);
      pos[i * 3 + 1] = a.h * 0.95 - u * (a.h + 6);
    } else if (motion === "sunny") {
      pos[i * 3] = Math.cos(ang) * (3 + u * 8);
      pos[i * 3 + 2] = Math.sin(ang) * (3 + u * 8);
      pos[i * 3 + 1] = a.h * 0.35 + u * (a.h * 0.7);
    } else if (motion === "fidget") {
      pos[i * 3] = Math.cos(ang * 1.6 + u * 8) * (r0 + 1);
      pos[i * 3 + 2] = Math.sin(ang * 1.6 + u * 8) * (r0 + 1);
      pos[i * 3 + 1] = a.h * (0.25 + 0.2 * Math.sin(u * 12 + i));
    } else {
      pos[i * 3] = Math.cos(ang) * (1.5 + u * 5);
      pos[i * 3 + 2] = Math.sin(ang) * (1.5 + u * 5);
      pos[i * 3 + 1] = 1 + u * (a.h + 4);
    }
  }
  a.aura.pts.geometry.attributes.position.needsUpdate = true;
}

function updateActors(dt) {
  const t = clock.elapsedTime;
  const k = 1 - Math.exp(-dt * 10);
  actors.forEach((a) => {
    const p = personaOf(a.index);
    const enclosed = a.enclosed();
    let want = 0;
    if (!enclosed && a.nestedIn == null) want = 1;
    else if (!enclosed && a.nestedIn != null) want = 0.28;
    else if (a.index === 0) want = 0.5;
    a.alive += (want - a.alive) * (1 - Math.exp(-dt * 2.4));
    const live = a.alive;
    const kLid = 1 - Math.exp(-dt * p.lid.speed);

    if (a.flight) {
      a.flight.t += dt / a.flight.dur;
      const u = Math.min(1, a.flight.t);
      const e = 1 - (1 - u) ** 3;
      a.pos.lerpVectors(a.flight.from, a.flight.to, e);
      a.pos.y = a.flight.from.y * (1 - e) + a.flight.to.y * e + Math.sin(u * Math.PI) * a.flight.height;
      a.yaw += (a.flight.spin || 0) * dt * (Math.PI * 2 / Math.max(0.2, a.flight.dur));
      if (u >= 1) {
        a.flight = null;
        a.pos.copy(a.goal);
        a.bounce = a.index === 4 ? 1.45 : 1;
        audio.land(a.index);
        if (a.index === 4) audio.giggle(4);
      }
    } else if (a.nestedIn != null) {
      const wp = a.worldPos();
      a.pos.lerp(wp, k);
      a.goal.copy(wp);
    } else {
      a.pos.lerp(a.goal, k);
    }

    if (!a.flight && a.nestedIn == null && dragging !== a) {
      a.glanceT -= dt;
      if (a.glanceT <= 0) {
        const span = p.glanceEvery;
        a.glanceT = span[0] + Math.random() * (span[1] - span[0]);
        a.goalYaw = pickGlance(a);
      }
    }

    a.lidT += (a.lidGoal - a.lidT) * kLid;
    a.yaw += (a.goalYaw - a.yaw) * (1 - Math.exp(-dt * (p.motion === "fidget" ? 8 : 3.4)));
    if (a.bounce > 0) a.bounce = Math.max(0, a.bounce - dt * (a.index === 4 ? 2.4 : 3.2));

    let ox = 0, oy = a.bounce * 0.8, oz = 0;
    let pitch = 0, roll = 0;
    let extraYaw = 0;
    const idle = live * (dragging === a ? 0.15 : 1);
    if (p.motion === "regal") {
      extraYaw = Math.sin(t * 0.4 + a.index) * 0.16 * idle;
      pitch = 0.06 + Math.sin(t * 0.7) * 0.16 * idle;
      oy += Math.sin(t * 0.55) * 0.4 * idle;
      if (a.flourish && a.flourish.t > 0) pitch += Math.sin(Math.min(1, a.flourish.t / a.flourish.dur) * Math.PI) * 0.42;
    } else if (p.motion === "glide") {
      const g = t * 0.95 + a.index;
      ox = Math.sin(g) * 6.2 * idle;
      oz = Math.cos(g * 0.8) * 4.4 * idle;
      extraYaw = Math.sin(g) * 0.55 * idle;
      roll = -Math.sin(g) * 0.24 * idle;
    } else if (p.motion === "sunny") {
      oy += Math.abs(Math.sin(t * 2.5 + a.hopPhase)) * 2.4 * idle;
      const lampYaw = yawToward(a.pos, new THREE.Vector3(-8, 0, 14));
      extraYaw += (lampYaw - a.yaw) * 0.55 * idle;
      pitch = -0.18 * idle;
    } else if (p.motion === "fidget") {
      extraYaw = Math.sin(t * 4.6 + a.hopPhase) * 0.7 * idle;
      ox = Math.sin(t * 3.8) * 2.4 * idle;
      oz = Math.cos(t * 4.2) * 1.8 * idle;
      if (Math.sin(t * 3.4 + a.hopPhase) > 0.55) a.bounce = Math.max(a.bounce, 0.95 * idle);
      if (a.flourish && a.flourish.t > 0) extraYaw += a.flourish.t / a.flourish.dur * Math.PI * 2;
    } else {
      oy += Math.abs(Math.sin(t * 5.4 + a.hopPhase)) * 3.1 * idle;
      roll = Math.sin(t * 6.2) * 0.28 * idle;
      extraYaw = Math.sin(t * 2.8) * 0.4 * idle + t * 0.55 * idle;
      if (a.flourish && a.flourish.t > 0) extraYaw += (a.flourish.t / a.flourish.dur) * Math.PI * 2.8;
    }

    if (a.flourish) {
      a.flourish.t += dt;
      if (a.flourish.t > a.flourish.dur) a.flourish = null;
    }

    const squash = 1 - a.bounce * (a.index === 4 ? 0.11 : 0.06);
    a.group.position.copy(a.pos);
    a.group.position.x += ox;
    a.group.position.y += oy;
    a.group.position.z += oz;
    a.group.scale.set(1 / squash, squash, 1 / squash);
    a.group.rotation.set(pitch, a.yaw + extraYaw, roll);
    a.group.visible = !enclosed;

    const lift = a.lidGoal > a.lidT ? easeOutBack(Math.min(1, a.lidT)) : a.lidT;
    a.lidPivot.position.y = (a.splitY || a.h * 0.5) + lift * p.lid.h;
    a.lidPivot.position.z = lift * p.lid.z;
    a.lidPivot.rotation.x = lift * p.lid.pitch;
    a.lidPivot.rotation.y = lift * p.lid.yaw;
    a.lidPivot.rotation.z = lift * p.lid.twist;

    const on = a.index === selected ? 0.92 : live > 0.7 ? 0.18 : 0;
    a.ring.material.opacity += (on - a.ring.material.opacity) * (1 - Math.exp(-dt * 10));
    updateAura(a, dt);
  });
  const dp = dust.geometry.attributes.position.array;
  for (let i = 0; i < dustN; i++) {
    dp[i * 3 + 1] += dt * (0.6 + (i % 5) * 0.12);
    if (dp[i * 3 + 1] > 104) dp[i * 3 + 1] = 0;
    dp[i * 3] += Math.sin(t * 0.2 + i) * dt * 0.4;
  }
  dust.geometry.attributes.position.needsUpdate = true;
  if (winterGroup.visible) {
    const sp = snowfall.geometry.attributes.position.array;
    for (let i = 0; i < snowN; i++) {
      sp[i * 3 + 1] -= dt * (8 + (i % 6));
      sp[i * 3] += Math.sin(t * 0.4 + i) * dt * 1.6;
      if (sp[i * 3 + 1] < -16) {
        sp[i * 3 + 1] = 108;
        sp[i * 3] = (Math.random() - 0.5) * 220;
        sp[i * 3 + 2] = (Math.random() - 0.5) * 220;
      }
    }
    snowfall.geometry.attributes.position.needsUpdate = true;
  }
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
  applyLang();
  applyRoom(currentRoom);
  setCache.sisters = await fetch("models/dolls.json").then((r) => r.json());
  spawnActors(setCache.sisters);
  applyLang();
  loading.hidden = true;
  tick();
}

main().catch((err) => {
  loading.textContent = lang === "ru" ? "Не удалось загрузить кукол" : "Could not load dolls";
  console.error(err);
});
