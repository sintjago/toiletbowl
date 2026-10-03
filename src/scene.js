import * as THREE from "three";
import { angleById } from "./catalog.js";

function paintTiles({ tile, grout, cols, rows, inset = 5 }) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = grout;
  ctx.fillRect(0, 0, 256, 256);
  const tw = 256 / cols;
  const th = 256 / rows;
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const shade = 1 - ((x * 13 + y * 29) % 5) * 0.012;
      ctx.fillStyle = shadeTile(tile, shade);
      ctx.fillRect(x * tw + inset / 2, y * th + inset / 2, tw - inset, th - inset);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function shadeTile(hex, amount) {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * amount));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * amount));
  const b = Math.min(255, Math.round((n & 255) * amount));
  return `rgb(${r}, ${g}, ${b})`;
}

function floorTexture() {
  const texture = paintTiles({
    tile: "#c3d4cc",
    grout: "#4f6a63",
    cols: 4,
    rows: 4,
    inset: 7,
  });
  texture.repeat.set(7, 7);
  return texture;
}

function wallTexture() {
  const texture = paintTiles({
    tile: "#dceae3",
    grout: "#5d7770",
    cols: 3,
    rows: 6,
    inset: 5,
  });
  texture.repeat.set(5, 3.2);
  return texture;
}

export function createScene(root, { angleId, background = "#b7cdc4", flush, onFrame } = {}) {
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
  renderer.toneMappingExposure = 0.88;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);
  scene.fog = new THREE.Fog(background, 8, 18);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
  camera.position.set(...angle.camera.position);
  camera.lookAt(...angle.camera.target);

  const hemi = new THREE.HemisphereLight("#f4fff8", "#6d8a82", 0.72);
  scene.add(hemi);

  const key = new THREE.DirectionalLight("#fff6ea", 1.15);
  key.position.set(3.4, 6.2, 2.8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 16;
  key.shadow.camera.left = -4;
  key.shadow.camera.right = 4;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -4;
  scene.add(key);

  const fill = new THREE.DirectionalLight("#c5ddd4", 0.38);
  fill.position.set(-3.2, 2.2, -1.4);
  scene.add(fill);

  const rim = new THREE.DirectionalLight("#ffe7c8", 0.4);
  rim.position.set(-1.8, 3.2, 4.4);
  scene.add(rim);

  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTexture(),
    roughness: 0.88,
    metalness: 0.03,
  });
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTexture(),
    roughness: 0.78,
    metalness: 0.02,
  });
  const boardMat = new THREE.MeshStandardMaterial({
    color: "#e8efe8",
    roughness: 0.7,
    metalness: 0.02,
  });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const back = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), wallMat);
  back.position.set(0, 3, -2.45);
  back.receiveShadow = true;
  scene.add(back);

  const side = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), wallMat);
  side.position.set(-2.7, 3, 0);
  side.rotation.y = Math.PI / 2;
  side.receiveShadow = true;
  scene.add(side);

  const base = new THREE.Mesh(new THREE.BoxGeometry(12, 0.12, 0.06), boardMat);
  base.position.set(0, 0.06, -2.42);
  scene.add(base);
  const sideBase = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 12), boardMat);
  sideBase.position.set(-2.67, 0.06, 0);
  scene.add(sideBase);

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
    panel.remove();
  };

  return { scene, camera, dispose };
}

export const porcelain = {
  color: "#fffdf8",
  roughness: 0.16,
  metalness: 0.02,
};

export const chrome = {
  color: "#eef3f2",
  roughness: 0.22,
  metalness: 0.52,
};
