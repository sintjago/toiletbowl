import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { angleById } from "./catalog.js";

function shadeTile(hex, amount) {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * amount));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * amount));
  const b = Math.min(255, Math.round((n & 255) * amount));
  return `rgb(${r}, ${g}, ${b})`;
}

function paintTiles({ tile, grout, cols, rows, inset, offset = false }) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = grout;
  ctx.fillRect(0, 0, 256, 256);
  const tw = 256 / cols;
  const th = 256 / rows;
  for (let y = 0; y < rows; y += 1) {
    const shift = offset && y % 2 ? tw / 2 : 0;
    for (let x = -1; x <= cols; x += 1) {
      const tone = 1 - ((x * 11 + y * 19) % 4) * 0.01;
      ctx.fillStyle = shadeTile(tile, tone);
      ctx.fillRect(x * tw + shift + inset / 2, y * th + inset / 2, tw - inset, th - inset);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function floorTexture() {
  const texture = paintTiles({
    tile: "#e7f3ee",
    grout: "#c8d8d1",
    cols: 4,
    rows: 4,
    inset: 4,
  });
  texture.repeat.set(8, 8);
  return texture;
}

function wallTexture() {
  const texture = paintTiles({
    tile: "#e9f5f0",
    grout: "#c5d6cf",
    cols: 2,
    rows: 6,
    inset: 4,
    offset: true,
  });
  texture.repeat.set(4, 3);
  return texture;
}

export function createScene(root, { angleId, background = "#e7f3ee", flush, onFrame } = {}) {
  const angle = angleById(angleId);
  const panel = document.createElement("div");
  panel.className = "panel";
  const canvas = document.createElement("canvas");
  canvas.className = "webgl-canvas flush-canvas";
  canvas.title = "Click to flush";
  panel.append(canvas);
  canvas.addEventListener("click", () => flush?.start());
  root.append(panel);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
  camera.position.set(...angle.camera.position);
  camera.lookAt(...angle.camera.target);

  const hemi = new THREE.HemisphereLight("#ffffff", "#9eb8b0", 0.85);
  scene.add(hemi);

  const key = new THREE.DirectionalLight("#fff8ef", 1.35);
  key.position.set(2.8, 5.4, 3.2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 16;
  key.shadow.camera.left = -4;
  key.shadow.camera.right = 4;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -4;
  scene.add(key);

  const fill = new THREE.DirectionalLight("#d7ebe4", 0.45);
  fill.position.set(-3.4, 2.4, -1.2);
  scene.add(fill);

  const rim = new THREE.DirectionalLight("#ffe9cc", 0.35);
  rim.position.set(-2.2, 3.4, 4.2);
  scene.add(rim);

  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTexture(),
    roughness: 0.82,
    metalness: 0.02,
  });
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTexture(),
    roughness: 0.7,
    metalness: 0.02,
  });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const back = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), wallMat);
  back.position.set(0, 3, -2.2);
  back.receiveShadow = true;
  scene.add(back);

  const resize = () => {
    const width = panel.clientWidth;
    const height = panel.clientHeight;
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(panel);

  let frame = 0;
  const tick = (now) => {
    onFrame?.(now);
    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  };
  tick();

  const dispose = () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    renderer.dispose();
    pmrem.dispose();
    panel.remove();
  };

  return { scene, camera, dispose };
}

export const porcelain = {
  color: "#ffffff",
  roughness: 0.12,
  metalness: 0.02,
};

export const chrome = {
  color: "#f2f5f6",
  roughness: 0.16,
  metalness: 0.85,
};
