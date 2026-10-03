import * as THREE from "three";
import { chrome, porcelain } from "./scene.js";

const OVAL_Z = 1.22;

function bowlProfile() {
  return [
    new THREE.Vector2(0.02, 0.0),
    new THREE.Vector2(0.4, 0.0),
    new THREE.Vector2(0.44, 0.02),
    new THREE.Vector2(0.43, 0.08),
    new THREE.Vector2(0.36, 0.16),
    new THREE.Vector2(0.3, 0.28),
    new THREE.Vector2(0.29, 0.4),
    new THREE.Vector2(0.38, 0.5),
    new THREE.Vector2(0.54, 0.58),
    new THREE.Vector2(0.64, 0.68),
    new THREE.Vector2(0.69, 0.78),
    new THREE.Vector2(0.7, 0.84),
    new THREE.Vector2(0.66, 0.875),
  ];
}

function wellProfile() {
  return [
    new THREE.Vector2(0.08, 0.48),
    new THREE.Vector2(0.16, 0.52),
    new THREE.Vector2(0.3, 0.6),
    new THREE.Vector2(0.42, 0.7),
    new THREE.Vector2(0.5, 0.8),
    new THREE.Vector2(0.52, 0.85),
  ];
}

function lidProfile() {
  return [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.44, 0.0),
    new THREE.Vector2(0.5, 0.008),
    new THREE.Vector2(0.515, 0.024),
    new THREE.Vector2(0.48, 0.04),
    new THREE.Vector2(0.3, 0.05),
    new THREE.Vector2(0.0, 0.054),
  ];
}

function roundedRectShape(w, h, radius) {
  const r = Math.min(radius, w / 2 - 0.001, h / 2 - 0.001);
  const x0 = -w / 2;
  const y0 = -h / 2;
  const x1 = w / 2;
  const y1 = h / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x0 + r, y0);
  shape.lineTo(x1 - r, y0);
  shape.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(x1, y1 - r);
  shape.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
  shape.lineTo(x0 + r, y1);
  shape.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(x0, y0 + r);
  shape.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
  return shape;
}

function roundedSlab(w, h, d, radius, segments, material) {
  const geo = new THREE.ExtrudeGeometry(roundedRectShape(w, h, radius), {
    depth: d,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: Math.max(3, Math.floor(segments / 6)),
  });
  geo.translate(0, 0, -d / 2);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function shade(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function waterTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const wash = ctx.createRadialGradient(128, 128, 6, 128, 128, 128);
  wash.addColorStop(0, "#0d4d5c");
  wash.addColorStop(0.22, "#1e8aa3");
  wash.addColorStop(0.55, "#2bb3c9");
  wash.addColorStop(1, "#0f5a68");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = "rgba(210, 245, 250, 0.45)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 7; a += 0.06) {
    const r = 10 + a * 16;
    ctx.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r);
  }
  ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function applyToiletPose(parts, pose) {
  parts.handlePivot.rotation.z = pose.handle * 0.85;
  parts.lidPivot.rotation.x = -pose.lid * 2.95;
  parts.seatPivot.rotation.x = 0;
  parts.water.visible = pose.lid > 0.05;
  parts.water.rotation.z = pose.swirl;
  const scale = 0.84 + pose.level * 0.16;
  parts.water.scale.set(scale, scale, 1);
  parts.water.material.opacity = 0.72 + pose.level * 0.22;
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
          clearcoat: 1,
          clearcoatRoughness: 0.08,
          side: THREE.DoubleSide,
        });
  const seatMat =
    material === "wire"
      ? bodyMat
      : new THREE.MeshPhysicalMaterial({
          color: "#f3eee4",
          roughness: 0.28,
          metalness: 0.02,
          clearcoat: 0.55,
          clearcoatRoughness: 0.22,
        });
  const chromeMat =
    material === "wire"
      ? new THREE.MeshBasicMaterial({ color: "#e8eef0", wireframe: true })
      : new THREE.MeshStandardMaterial(chrome);
  const wellMat =
    material === "wire"
      ? new THREE.MeshBasicMaterial({ color: "#d7eeef", wireframe: true, side: THREE.DoubleSide })
      : new THREE.MeshPhysicalMaterial({
          color: "#eef8f7",
          roughness: 0.08,
          metalness: 0.03,
          clearcoat: 0.9,
          clearcoatRoughness: 0.1,
          side: THREE.DoubleSide,
        });
  const waterMat =
    material === "wire"
      ? new THREE.MeshBasicMaterial({ color: "#1f9bb3", wireframe: true })
      : new THREE.MeshPhysicalMaterial({
          map: waterTexture(),
          color: "#3ec4d6",
          roughness: 0.04,
          metalness: 0.12,
          transparent: true,
          opacity: 0.92,
          side: THREE.DoubleSide,
        });
  const darkMat =
    material === "wire"
      ? new THREE.MeshBasicMaterial({ color: "#243330", wireframe: true })
      : new THREE.MeshStandardMaterial({ color: "#243330", roughness: 0.65, metalness: 0.08 });

  const radial = Math.max(10, segments);
  const bowlZ = 0.3;

  const foot = shade(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.43, 0.07, radial), bodyMat));
  foot.position.set(0, 0.035, bowlZ - 0.04);
  foot.scale.set(1.05, 1, 1.38);
  group.add(foot);

  const bowl = shade(new THREE.Mesh(new THREE.LatheGeometry(bowlProfile(), radial), bodyMat));
  bowl.position.set(0, 0, bowlZ);
  bowl.scale.set(1, 1, OVAL_Z);
  group.add(bowl);

  const rim = shade(new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.038, 10, radial), bodyMat));
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 0.868, bowlZ);
  rim.scale.set(1, OVAL_Z, 1);
  group.add(rim);

  const well = shade(new THREE.Mesh(new THREE.LatheGeometry(wellProfile(), radial), wellMat));
  well.position.set(0, 0, bowlZ);
  well.scale.set(1, 1, OVAL_Z);
  group.add(well);

  const drain = new THREE.Mesh(new THREE.CircleGeometry(0.1, 20), darkMat);
  drain.rotation.x = -Math.PI / 2;
  drain.position.set(0.02, 0.485, bowlZ + 0.04);
  group.add(drain);

  const water = new THREE.Mesh(new THREE.CircleGeometry(0.4, 48), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.76, bowlZ + 0.03);
  water.scale.set(1, OVAL_Z * 0.9, 1);
  water.visible = false;
  group.add(water);

  const trap = shade(new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.115, 14, Math.max(12, segments / 2), Math.PI * 1.15), bodyMat));
  trap.position.set(-0.3, 0.3, bowlZ - 0.06);
  trap.rotation.set(Math.PI / 2, 0.18, Math.PI * 0.42);
  group.add(trap);

  const neck = shade(new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.42, Math.max(12, segments / 2)), bodyMat));
  neck.rotation.x = Math.PI / 2;
  neck.position.set(0, 0.72, -0.08);
  group.add(neck);

  const skirt = shade(roundedSlab(0.86, 0.34, 0.3, 0.1, segments, bodyMat));
  skirt.position.set(0, 0.76, -0.26);
  group.add(skirt);

  const hingeZ = -0.18;
  const hingeY = 0.872;

  const seatPivot = new THREE.Group();
  seatPivot.position.set(0, hingeY, hingeZ);
  const seat = shade(new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.042, 12, radial), seatMat));
  seat.rotation.x = Math.PI / 2;
  seat.position.set(0, 0.016, 0.5);
  seat.scale.set(1.02, OVAL_Z, 1);
  seatPivot.add(seat);
  const seatLine = new THREE.Mesh(
    new THREE.TorusGeometry(0.545, 0.006, 8, radial),
    material === "wire"
      ? new THREE.MeshBasicMaterial({ color: "#1b1b1b", wireframe: true })
      : new THREE.MeshBasicMaterial({ color: "#2b2b2b" }),
  );
  seatLine.rotation.x = Math.PI / 2;
  seatLine.position.set(0, 0.03, 0.5);
  seatLine.scale.set(1.02, OVAL_Z, 1);
  seatPivot.add(seatLine);
  group.add(seatPivot);

  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, hingeY + 0.028, hingeZ - 0.02);
  const lid = shade(new THREE.Mesh(new THREE.LatheGeometry(lidProfile(), radial), bodyMat));
  lid.position.set(0, 0.01, 0.5);
  lid.scale.set(1.02, 1, OVAL_Z * 0.98);
  lidPivot.add(lid);
  group.add(lidPivot);

  [-0.16, 0.16].forEach((x) => {
    const block = shade(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.036, 0.1), bodyMat));
    block.position.set(x, hingeY + 0.018, hingeZ);
    group.add(block);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.09, 10), chromeMat);
    pin.rotation.z = Math.PI / 2;
    pin.position.set(x, hingeY + 0.026, hingeZ + 0.01);
    group.add(pin);
  });

  const tank = shade(roundedSlab(1.12, 0.74, 0.36, 0.08, segments, bodyMat));
  tank.position.set(0, 1.26, -0.66);
  group.add(tank);

  const tankLid = shade(roundedSlab(1.16, 0.065, 0.4, 0.045, segments, bodyMat));
  tankLid.position.set(0, 1.66, -0.66);
  group.add(tankLid);

  const cap = shade(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.018, 14), bodyMat));
  cap.position.set(0.32, 1.7, -0.66);
  group.add(cap);

  const handlePivot = new THREE.Group();
  handlePivot.position.set(-0.3, 1.48, -0.47);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.016, 14), chromeMat);
  plate.rotation.x = Math.PI / 2;
  handlePivot.add(plate);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 12), chromeMat);
  arm.rotation.z = Math.PI / 2;
  arm.position.set(-0.11, 0, 0);
  handlePivot.add(arm);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.028, 14, 12), chromeMat);
  knob.position.set(-0.23, 0, 0);
  handlePivot.add(knob);
  group.add(handlePivot);

  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.72, 12), chromeMat);
  pipe.position.set(-0.52, 0.38, -0.7);
  group.add(pipe);
  const joint = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), chromeMat);
  joint.position.set(-0.52, 0.74, -0.7);
  group.add(joint);
  const inlet = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.14, 10), chromeMat);
  inlet.rotation.x = Math.PI / 2;
  inlet.position.set(-0.52, 0.74, -0.63);
  group.add(inlet);
  const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.024, 12), chromeMat);
  flange.position.set(-0.52, 0.014, -0.7);
  group.add(flange);

  [
    [-0.16, 0.62],
    [0.16, 0.62],
  ].forEach(([x, z]) => {
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.02, 12), chromeMat);
    bolt.position.set(x, 0.08, z);
    group.add(bolt);
  });

  return { group, lidPivot, seatPivot, handlePivot, water };
}
