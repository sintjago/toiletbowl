import * as THREE from "three";
import { chrome, porcelain } from "./scene.js";

function bowlProfile() {
  return [
    new THREE.Vector2(0.24, 0.0),
    new THREE.Vector2(0.35, 0.05),
    new THREE.Vector2(0.39, 0.24),
    new THREE.Vector2(0.43, 0.46),
    new THREE.Vector2(0.68, 0.56),
    new THREE.Vector2(0.81, 0.68),
    new THREE.Vector2(0.83, 0.8),
    new THREE.Vector2(0.7, 0.85),
    new THREE.Vector2(0.6, 0.86),
  ];
}

export function applyToiletPose(parts, pose) {
  parts.handlePivot.rotation.z = pose.handle * 0.95;
  parts.lidPivot.rotation.x = -pose.lid * 2.15;
  parts.seatPivot.rotation.x = 0;
  parts.water.visible = pose.lid > 0.05;
  parts.water.rotation.z = pose.swirl;
  const scale = 0.72 + pose.level * 0.28;
  parts.water.scale.set(scale, scale, 1);
  parts.water.material.opacity = 0.55 + pose.level * 0.35;
  parts.group.position.x = pose.shake * 0.01;
}

export function createToilet({
  segments = 48,
  material = "porcelain",
} = {}) {
  const group = new THREE.Group();
  const bodyMat =
    material === "wire"
      ? new THREE.MeshBasicMaterial({ color: "#16332f", wireframe: true, side: THREE.DoubleSide })
      : new THREE.MeshPhysicalMaterial({
          ...porcelain,
          clearcoat: 0.7,
          clearcoatRoughness: 0.18,
          side: THREE.DoubleSide,
        });
  const chromeMat =
    material === "wire"
      ? new THREE.MeshBasicMaterial({ color: "#c9d4d1", wireframe: true })
      : new THREE.MeshStandardMaterial(chrome);
  const waterMat =
    material === "wire"
      ? new THREE.MeshBasicMaterial({ color: "#4d7d8c", wireframe: true })
      : new THREE.MeshStandardMaterial({
          color: "#2a9bb8",
          roughness: 0.08,
          metalness: 0.08,
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide,
        });

  const bowl = new THREE.Mesh(new THREE.LatheGeometry(bowlProfile(), segments), bodyMat);
  bowl.position.set(0, 0, 0.3);
  bowl.castShadow = true;
  bowl.receiveShadow = true;
  group.add(bowl);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.54, 0.05, 10, Math.max(16, segments)),
    bodyMat,
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 0.82, 0.3);
  rim.castShadow = true;
  group.add(rim);

  const hingeZ = -0.22;
  const hingeY = 0.86;

  const seatPivot = new THREE.Group();
  seatPivot.position.set(0, hingeY, hingeZ);
  const seat = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.06, 10, Math.max(16, segments)),
    bodyMat,
  );
  seat.rotation.x = Math.PI / 2;
  seat.position.set(0, 0.02, 0.52);
  seat.castShadow = true;
  seatPivot.add(seat);
  group.add(seatPivot);

  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, hingeY + 0.04, hingeZ - 0.04);
  const lidGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.05, Math.max(16, segments));
  lidGeom.scale(1.02, 1, 1.18);
  const lid = new THREE.Mesh(lidGeom, bodyMat);
  lid.position.set(0, 0.04, 0.5);
  lid.castShadow = true;
  lidPivot.add(lid);
  group.add(lidPivot);

  const tank = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.86, 0.38), bodyMat);
  tank.position.set(0, 1.22, -0.64);
  tank.castShadow = true;
  group.add(tank);

  const tankLid = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.07, 0.42), bodyMat);
  tankLid.position.set(0, 1.68, -0.64);
  tankLid.castShadow = true;
  group.add(tankLid);

  const handlePivot = new THREE.Group();
  handlePivot.position.set(-0.28, 1.52, -0.4);
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
  trap.position.set(0, 0.14, 0.24);
  trap.castShadow = true;
  group.add(trap);

  const wellMat =
    material === "wire"
      ? new THREE.MeshBasicMaterial({ color: "#1f4d56", wireframe: true, side: THREE.DoubleSide })
      : new THREE.MeshStandardMaterial({
          color: "#1f4d56",
          roughness: 0.55,
          metalness: 0.04,
          side: THREE.DoubleSide,
        });
  const well = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.22, 0.34, Math.max(16, segments), 1, true),
    wellMat,
  );
  well.position.set(0, 0.66, 0.3);
  group.add(well);

  const water = new THREE.Mesh(new THREE.CircleGeometry(0.34, 32), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.74, 0.3);
  water.visible = false;
  group.add(water);

  return { group, lidPivot, seatPivot, handlePivot, water };
}
