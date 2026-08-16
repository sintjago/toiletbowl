import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function createScene(root, { cameraZ = 5.4, cameraY = 1.6 } = {}) {
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
  scene.background = new THREE.Color("#eef6f3");

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  camera.position.set(3.4, cameraY, cameraZ);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.target.set(0, 0.85, 0);
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minDistance = 3;
  controls.maxDistance = 10;

  const hemi = new THREE.HemisphereLight("#f7fff9", "#8fb8ae", 1.1);
  scene.add(hemi);

  const key = new THREE.DirectionalLight("#ffffff", 1.35);
  key.position.set(4, 7, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);

  const fill = new THREE.DirectionalLight("#cfe8e2", 0.55);
  fill.position.set(-4, 2, -2);
  scene.add(fill);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(6, 48),
    new THREE.MeshStandardMaterial({ color: "#d7efe8", roughness: 0.9 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

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
    controls.update();
    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  };
  tick();

  const dispose = () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    controls.dispose();
    renderer.dispose();
    panel.remove();
  };

  return { scene, dispose };
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

export const water = {
  color: "#7aa8b8",
  roughness: 0.08,
  metalness: 0.1,
  transparent: true,
  opacity: 0.72,
};
