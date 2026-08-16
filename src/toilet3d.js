import * as THREE from "three";
import { chrome, porcelain } from "./scene.js";

function bowlProfile() {
  return [
    new THREE.Vector2(0.2, 0.0),
    new THREE.Vector2(0.3, 0.05),
    new THREE.Vector2(0.34, 0.22),
    new THREE.Vector2(0.38, 0.42),
    new THREE.Vector2(0.62, 0.52),
    new THREE.Vector2(0.78, 0.64),
    new THREE.Vector2(0.84, 0.78),
    new THREE.Vector2(0.72, 0.82),
    new THREE.Vector2(0.5, 0.7),
  ];
}

export function createToilet({
  segments = 48,
  material = "porcelain",
} = {}) {
  const group = new THREE.Group();
  const bodyMat =
    material === "wire"
      ? new THREE.MeshBasicMaterial({
          color: "#16332f",
          wireframe: true,
        })
      : new THREE.MeshPhysicalMaterial({
          ...porcelain,
          clearcoat: 0.7,
          clearcoatRoughness: 0.18,
        });
  const chromeMat =
    material === "wire"
      ? new THREE.MeshBasicMaterial({ color: "#c9d4d1", wireframe: true })
      : new THREE.MeshStandardMaterial(chrome);

  const bowl = new THREE.Mesh(
    new THREE.LatheGeometry(bowlProfile(), segments),
    bodyMat,
  );
  bowl.position.set(0, 0, 0.22);
  bowl.castShadow = true;
  bowl.receiveShadow = true;
  group.add(bowl);

  const lid = new THREE.Mesh(new THREE.SphereGeometry(1, segments, 18), bodyMat);
  lid.scale.set(0.58, 0.09, 0.74);
  lid.position.set(0, 0.9, 0.28);
  lid.castShadow = true;
  group.add(lid);

  const tank = new THREE.Mesh(
    new THREE.BoxGeometry(1.18, 0.86, 0.4, 1, 1, 1),
    bodyMat,
  );
  tank.position.set(0, 1.22, -0.58);
  tank.castShadow = true;
  group.add(tank);

  const tankLid = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.07, 0.44), bodyMat);
  tankLid.position.set(0, 1.68, -0.58);
  tankLid.castShadow = true;
  group.add(tankLid);

  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.26, Math.max(8, segments / 3)),
    chromeMat,
  );
  handle.rotation.z = Math.PI / 2;
  handle.position.set(-0.4, 1.52, -0.34);
  group.add(handle);

  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, Math.max(8, segments / 3), 12),
    chromeMat,
  );
  knob.position.set(-0.54, 1.52, -0.34);
  group.add(knob);

  const trap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.24, 0.3, Math.max(10, segments / 3)),
    bodyMat,
  );
  trap.position.set(0, 0.14, 0.18);
  trap.castShadow = true;
  group.add(trap);

  return group;
}
