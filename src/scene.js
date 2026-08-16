import * as THREE from "three";
import { angleById } from "./catalog.js";

function tileTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#d7efe8";
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = "#f7fff9";
  ctx.lineWidth = 6;
  for (let i = 0; i <= 256; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createScene(root, { angleId, background = "#e8f3ef" } = {}) {
  const angle = angleById(angleId);
  const panel = document.createElement("div");
  panel.className = "panel";
  const canvas = document.createElement("canvas");
  canvas.className = "webgl-canvas";
  panel.append(canvas);
  root.append(panel);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
  camera.position.set(...angle.camera.position);
  camera.lookAt(...angle.camera.target);

  const hemi = new THREE.HemisphereLight("#f7fff9", "#8fb8ae", 1.05);
  scene.add(hemi);

  const key = new THREE.DirectionalLight("#ffffff", 1.3);
  key.position.set(3.4, 6.2, 2.8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);

  const fill = new THREE.DirectionalLight("#cfe8e2", 0.5);
  fill.position.set(-3.2, 2.2, -1.4);
  scene.add(fill);

  const tiles = new THREE.MeshStandardMaterial({
    map: tileTexture(),
    roughness: 0.92,
    metalness: 0.02,
  });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), tiles);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const wall = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), tiles);
  wall.position.set(0, 3, -2.4);
  wall.receiveShadow = true;
  scene.add(wall);

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
  const tick = () => {
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
  roughness: 0.22,
  metalness: 0.04,
};

export const chrome = {
  color: "#c9d4d1",
  roughness: 0.18,
  metalness: 0.85,
};
