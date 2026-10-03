import * as THREE from "three";
import { chrome, porcelain } from "./scene.js";

const OVAL_Z = 1.18;

function bowlProfile() {
  return [
    new THREE.Vector2(0.02, 0.0),
    new THREE.Vector2(0.3, 0.0),
    new THREE.Vector2(0.37, 0.016),
    new THREE.Vector2(0.39, 0.05),
    new THREE.Vector2(0.34, 0.09),
    new THREE.Vector2(0.2, 0.2),
    new THREE.Vector2(0.165, 0.32),
    new THREE.Vector2(0.175, 0.44),
    new THREE.Vector2(0.3, 0.52),
    new THREE.Vector2(0.46, 0.6),
    new THREE.Vector2(0.57, 0.7),
    new THREE.Vector2(0.63, 0.8),
    new THREE.Vector2(0.645, 0.855),
    new THREE.Vector2(0.61, 0.88),
  ];
}

function wellProfile() {
  return [
    new THREE.Vector2(0.1, 0.46),
    new THREE.Vector2(0.14, 0.5),
    new THREE.Vector2(0.26, 0.58),
    new THREE.Vector2(0.38, 0.68),
    new THREE.Vector2(0.46, 0.78),
    new THREE.Vector2(0.49, 0.84),
  ];
}

function lidProfile() {
  return [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.46, 0.0),
    new THREE.Vector2(0.52, 0.012),
    new THREE.Vector2(0.535, 0.03),
    new THREE.Vector2(0.5, 0.055),
    new THREE.Vector2(0.34, 0.072),
    new THREE.Vector2(0.0, 0.08),
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
    bevelEnabled: false,
    curveSegments: Math.max(3, Math.floor(segments / 6)),
  });
  geo.translate(0, 0, -d / 2);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function waterTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const wash = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
  wash.addColorStop(0, "#15586a");
  wash.addColorStop(0.4, "#2a9bb8");
  wash.addColorStop(0.82, "#1d7384");
  wash.addColorStop(1, "#134854");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = "rgba(232, 248, 252, 0.32)";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 7; a += 0.07) {
    const r = 12 + a * 15.5;
    ctx.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r);
  }
  ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function shade(mesh, enabled) {
  mesh.castShadow = enabled;
  mesh.receiveShadow = enabled;
  return mesh;
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
          clearcoat: 0.82,
          clearcoatRoughness: 0.14,
          sheen: 0.18,
          sheenColor: new THREE.Color("#fff7ea"),
          side: THREE.DoubleSide,
        });
  const chromeMat =
    material === "wire"
      ? new THREE.MeshBasicMaterial({ color: "#e8eef0", wireframe: true })
      : new THREE.MeshStandardMaterial(chrome);
  const wellMat =
    material === "wire"
      ? new THREE.MeshBasicMaterial({ color: "#cfe6e6", wireframe: true, side: THREE.DoubleSide })
      : new THREE.MeshPhysicalMaterial({
          color: "#e7f3f3",
          roughness: 0.1,
          metalness: 0.02,
          clearcoat: 0.7,
          clearcoatRoughness: 0.12,
          side: THREE.DoubleSide,
        });
  const waterMat =
    material === "wire"
      ? new THREE.MeshBasicMaterial({ color: "#2a9bb8", wireframe: true })
      : new THREE.MeshStandardMaterial({
          map: waterTexture(),
          color: "#7fc7d6",
          roughness: 0.06,
          metalness: 0.1,
          transparent: true,
          opacity: 0.88,
          side: THREE.DoubleSide,
        });
  const darkMat =
    material === "wire"
      ? new THREE.MeshBasicMaterial({ color: "#2a3d3a", wireframe: true })
      : new THREE.MeshStandardMaterial({ color: "#2a3d3a", roughness: 0.7, metalness: 0.08 });

  const radial = Math.max(8, segments);
  const bowlZ = 0.28;

  const bowl = shade(new THREE.Mesh(new THREE.LatheGeometry(bowlProfile(), radial), bodyMat), true);
  bowl.position.set(0, 0, bowlZ);
  bowl.scale.set(1, 1, OVAL_Z);
  group.add(bowl);

  const rim = shade(new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.042, 10, radial), bodyMat), true);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 0.868, bowlZ);
  rim.scale.set(1, OVAL_Z, 1);
  group.add(rim);

  const well = shade(new THREE.Mesh(new THREE.LatheGeometry(wellProfile(), radial), wellMat), true);
  well.position.set(0, 0, bowlZ);
  well.scale.set(1, 1, OVAL_Z);
  group.add(well);

  const drain = new THREE.Mesh(new THREE.CircleGeometry(0.09, Math.max(12, segments / 2)), darkMat);
  drain.rotation.x = -Math.PI / 2;
  drain.position.set(0, 0.462, bowlZ + 0.02);
  group.add(drain);

  const water = new THREE.Mesh(new THREE.CircleGeometry(0.36, 40), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.73, bowlZ + 0.02);
  water.scale.set(1, OVAL_Z * 0.92, 1);
  water.visible = false;
  group.add(water);

  const neck = shade(new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.38, Math.max(10, segments / 2)), bodyMat), true);
  neck.rotation.x = Math.PI / 2;
  neck.position.set(0, 0.74, -0.12);
  group.add(neck);

  const skirt = shade(roundedSlab(0.78, 0.3, 0.28, 0.08, segments, bodyMat), true);
  skirt.position.set(0, 0.78, -0.28);
  group.add(skirt);

  const hingeZ = -0.2;
  const hingeY = 0.875;

  const seatPivot = new THREE.Group();
  seatPivot.position.set(0, hingeY, hingeZ);
  const seat = shade(new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.052, 12, radial), bodyMat), true);
  seat.rotation.x = Math.PI / 2;
  seat.position.set(0, 0.018, 0.5);
  seat.scale.set(1.02, OVAL_Z, 1);
  seatPivot.add(seat);
  [-0.18, 0.18, 0, -0.28, 0.28].forEach((x, i) => {
    const bump = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.01, 8), darkMat);
    bump.position.set(x, 0.0, 0.32 + (i % 2) * 0.28);
    seatPivot.add(bump);
  });
  group.add(seatPivot);

  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, hingeY + 0.03, hingeZ - 0.03);
  const lid = shade(new THREE.Mesh(new THREE.LatheGeometry(lidProfile(), radial), bodyMat), true);
  lid.position.set(0, 0.012, 0.5);
  lid.scale.set(1.04, 1, OVAL_Z * 1.02);
  lidPivot.add(lid);
  group.add(lidPivot);

  [-0.17, 0.17].forEach((x) => {
    const block = shade(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.04, 0.11), bodyMat), true);
    block.position.set(x, hingeY + 0.02, hingeZ - 0.01);
    group.add(block);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 10), chromeMat);
    pin.rotation.z = Math.PI / 2;
    pin.position.set(x, hingeY + 0.028, hingeZ);
    group.add(pin);
  });

  const tank = shade(roundedSlab(1.1, 0.8, 0.36, 0.09, segments, bodyMat), true);
  tank.position.set(0, 1.24, -0.68);
  group.add(tank);

  const tankLid = shade(roundedSlab(1.16, 0.07, 0.4, 0.05, segments, bodyMat), true);
  tankLid.position.set(0, 1.675, -0.68);
  group.add(tankLid);

  const cap = shade(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, Math.max(10, segments / 3)), bodyMat), true);
  cap.position.set(0.28, 1.715, -0.68);
  group.add(cap);

  const handlePivot = new THREE.Group();
  handlePivot.position.set(-0.32, 1.5, -0.48);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.018, 16), chromeMat);
  plate.rotation.x = Math.PI / 2;
  handlePivot.add(plate);
  const arm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, 0.24, Math.max(8, segments / 3)),
    chromeMat,
  );
  arm.rotation.z = Math.PI / 2;
  arm.position.set(-0.13, 0, 0);
  handlePivot.add(arm);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.055, Math.max(10, segments / 3), 12), chromeMat);
  knob.position.set(-0.26, 0, 0);
  handlePivot.add(knob);
  group.add(handlePivot);

  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.78, Math.max(8, segments / 3)), chromeMat);
  pipe.position.set(-0.5, 0.4, -0.7);
  group.add(pipe);
  const joint = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 10), chromeMat);
  joint.position.set(-0.5, 0.79, -0.7);
  group.add(joint);
  const inlet = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.16, 10), chromeMat);
  inlet.rotation.x = Math.PI / 2;
  inlet.position.set(-0.5, 0.79, -0.62);
  group.add(inlet);
  const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.028, 12), chromeMat);
  flange.position.set(-0.5, 0.016, -0.7);
  group.add(flange);

  [
    [-0.22, 0.48],
    [0.22, 0.48],
    [-0.22, 0.1],
    [0.22, 0.1],
  ].forEach(([x, z]) => {
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.018, 10), chromeMat);
    bolt.position.set(x, 0.01, z);
    group.add(bolt);
  });

  const contact = new THREE.Mesh(
    new THREE.CircleGeometry(0.58, 36),
    material === "wire"
      ? new THREE.MeshBasicMaterial({ color: "#1a2e2a", wireframe: true })
      : new THREE.MeshBasicMaterial({ color: "#1a2e2a", transparent: true, opacity: 0.16 }),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.set(0, 0.002, 0.16);
  contact.scale.set(1.05, 1.28, 1);
  group.add(contact);

  return { group, lidPivot, seatPivot, handlePivot, water };
}
