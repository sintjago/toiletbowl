import * as THREE from "three";
import { chrome, porcelain } from "./scene.js";

function bowlProfile() {
  return [
    new THREE.Vector2(0.2, 0.0),
    new THREE.Vector2(0.32, 0.04),
    new THREE.Vector2(0.36, 0.22),
    new THREE.Vector2(0.4, 0.44),
    new THREE.Vector2(0.66, 0.54),
    new THREE.Vector2(0.8, 0.66),
    new THREE.Vector2(0.84, 0.8),
    new THREE.Vector2(0.7, 0.84),
    new THREE.Vector2(0.42, 0.72),
  ];
}

export function applyToiletPose(parts, pose) {
  parts.handlePivot.rotation.z = pose.handle * 0.95;
  parts.lidPivot.rotation.x = -pose.lid * 1.92;
  parts.seatPivot.rotation.x = -pose.seat * 1.45;
  parts.water.visible = pose.lid > 0.12 || pose.seat > 0.12;
  parts.water.rotation.z = pose.swirl;
  const scale = 0.62 + pose.level * 0.38;
  parts.water.scale.set(scale, scale, 1);
  parts.water.material.opacity = 0.28 + pose.level * 0.5;
  parts.group.position.x = pose.shake * 0.01;
}

function ovalDisc(radiusX, radiusZ, height, segments) {
  const geometry = new THREE.CylinderGeometry(1, 1, height, Math.max(16, segments));
  geometry.scale(radiusX, 1, radiusZ);
  return geometry;
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
  const waterMat =
    material === "wire"
      ? new THREE.MeshBasicMaterial({ color: "#4d7d8c", wireframe: true })
      : new THREE.MeshStandardMaterial({
          color: "#4d7d8c",
          roughness: 0.08,
          metalness: 0.08,
          transparent: true,
          opacity: 0.7,
        });

  const bowl = new THREE.Mesh(
    new THREE.LatheGeometry(bowlProfile(), segments),
    bodyMat,
  );
  bowl.position.set(0, 0, 0.28);
  bowl.castShadow = true;
  bowl.receiveShadow = true;
  group.add(bowl);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.52, 0.055, 12, Math.max(16, segments)),
    bodyMat,
  );
  rim.rotation.x = Math.PI / 2;
  rim.scale.set(1, 1.22, 1);
  rim.position.set(0, 0.82, 0.32);
  rim.castShadow = true;
  group.add(rim);

  const hinge = { x: 0, y: 0.86, z: -0.18 };

  const seatPivot = new THREE.Group();
  seatPivot.position.set(hinge.x, hinge.y - 0.02, hinge.z);
  const seat = new THREE.Mesh(
    new THREE.TorusGeometry(0.48, 0.07, 12, Math.max(16, segments), Math.PI * 1.72),
    bodyMat,
  );
  seat.rotation.x = Math.PI / 2;
  seat.rotation.z = Math.PI * 0.14;
  seat.scale.set(1, 1.22, 1);
  seat.position.set(0, 0.01, 0.5);
  seat.castShadow = true;
  seatPivot.add(seat);
  group.add(seatPivot);

  const lidPivot = new THREE.Group();
  lidPivot.position.set(hinge.x, hinge.y + 0.04, hinge.z);
  const lid = new THREE.Mesh(ovalDisc(0.52, 0.66, 0.055, segments), bodyMat);
  lid.position.set(0, 0.04, 0.5);
  lid.castShadow = true;
  lidPivot.add(lid);
  group.add(lidPivot);

  const tank = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.86, 0.4), bodyMat);
  tank.position.set(0, 1.22, -0.62);
  tank.castShadow = true;
  group.add(tank);

  const tankLid = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.07, 0.44), bodyMat);
  tankLid.position.set(0, 1.68, -0.62);
  tankLid.castShadow = true;
  group.add(tankLid);

  const handlePivot = new THREE.Group();
  handlePivot.position.set(-0.28, 1.52, -0.38);
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.26, Math.max(8, segments / 3)),
    chromeMat,
  );
  handle.rotation.z = Math.PI / 2;
  handle.position.set(-0.12, 0, 0);
  handlePivot.add(handle);
  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, Math.max(8, segments / 3), 12),
    chromeMat,
  );
  knob.position.set(-0.26, 0, 0);
  handlePivot.add(knob);
  group.add(handlePivot);

  const trap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.24, 0.3, Math.max(10, segments / 3)),
    bodyMat,
  );
  trap.position.set(0, 0.14, 0.22);
  trap.castShadow = true;
  group.add(trap);

  const water = new THREE.Mesh(new THREE.CircleGeometry(0.34, 32), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.scale.set(1, 1.18, 1);
  water.position.set(0, 0.58, 0.34);
  water.visible = false;
  group.add(water);

  return { group, lidPivot, seatPivot, handlePivot, water };
}
