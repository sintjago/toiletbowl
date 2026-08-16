import * as THREE from "three";
import { chrome, createScene, porcelain, water } from "./scene.js";

function bowlProfile() {
  const pts = [
    new THREE.Vector2(0.18, 0.0),
    new THREE.Vector2(0.28, 0.06),
    new THREE.Vector2(0.32, 0.22),
    new THREE.Vector2(0.36, 0.38),
    new THREE.Vector2(0.58, 0.48),
    new THREE.Vector2(0.78, 0.58),
    new THREE.Vector2(0.86, 0.7),
    new THREE.Vector2(0.82, 0.78),
    new THREE.Vector2(0.62, 0.74),
    new THREE.Vector2(0.42, 0.58),
    new THREE.Vector2(0.22, 0.48),
  ];
  return new THREE.LatheGeometry(pts, 48);
}

export function mountModel(root) {
  const { scene, dispose } = createScene(root);
  const group = new THREE.Group();
  scene.add(group);

  const bodyMat = new THREE.MeshPhysicalMaterial({
    ...porcelain,
    clearcoat: 0.65,
    clearcoatRoughness: 0.2,
  });
  const chromeMat = new THREE.MeshStandardMaterial(chrome);
  const waterMat = new THREE.MeshStandardMaterial(water);

  const bowl = new THREE.Mesh(bowlProfile(), bodyMat);
  bowl.position.set(0, 0, 0.18);
  bowl.castShadow = true;
  bowl.receiveShadow = true;
  group.add(bowl);

  const seat = new THREE.Mesh(
    new THREE.TorusGeometry(0.58, 0.09, 18, 48),
    bodyMat,
  );
  seat.rotation.x = Math.PI / 2;
  seat.position.set(0, 0.78, 0.2);
  seat.castShadow = true;
  group.add(seat);

  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(1.28, 0.07, 0.92),
    bodyMat,
  );
  lid.position.set(0, 1.42, -0.62);
  lid.castShadow = true;
  group.add(lid);

  const tank = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.92, 0.42), bodyMat);
  tank.position.set(0, 1.18, -0.62);
  tank.castShadow = true;
  group.add(tank);

  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.28, 16),
    chromeMat,
  );
  handle.rotation.z = Math.PI / 2;
  handle.position.set(0.52, 1.42, -0.38);
  group.add(handle);

  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), chromeMat);
  knob.position.set(0.66, 1.42, -0.38);
  group.add(knob);

  const pool = new THREE.Mesh(new THREE.CircleGeometry(0.34, 32), waterMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, 0.56, 0.2);
  group.add(pool);

  const trap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.2, 0.28, 20),
    bodyMat,
  );
  trap.position.set(0, 0.14, 0.18);
  trap.castShadow = true;
  group.add(trap);

  return dispose;
}
