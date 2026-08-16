import "./style.css";
import { ANGLES, GROUPS, STYLES, styleById } from "./catalog.js";
import { createFlush } from "./flush.js";
import { mountFilter } from "./filters.js";
import { mountImage } from "./image.js";

const stage = document.querySelector("#stage");
const caption = document.querySelector("#caption");
const hint = document.querySelector("#hint");
const styleNav = document.querySelector("#styles");
const angleNav = document.querySelector("#angles");
const count = document.querySelector("#count");
const flushBtn = document.querySelector("#flush");
const flushStatus = document.querySelector("#flush-status");

let angleId = ANGLES[0].id;
let styleId = "photo";
let teardown = null;
let requestId = 0;
const flush = createFlush();
let flushWatch = 0;

const scenes = {
  porcelain: () => import("./model3d.js").then((mod) => mod.mountPorcelain),
  wireframe: () => import("./model3d.js").then((mod) => mod.mountWireframe),
  lowpoly: () => import("./model3d.js").then((mod) => mod.mountLowpoly),
  voxels: () => import("./voxels.js").then((mod) => mod.mountVoxels),
};

function renderPicker() {
  angleNav.innerHTML = "";
  ANGLES.forEach((angle) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "view-btn";
    button.dataset.angle = angle.id;
    button.textContent = angle.label;
    button.classList.toggle("is-active", angle.id === angleId);
    button.addEventListener("click", () => setAngle(angle.id));
    angleNav.append(button);
  });

  styleNav.innerHTML = "";
  GROUPS.forEach((group) => {
    const block = document.createElement("section");
    block.className = "style-group";
    block.innerHTML = `<h2>${group}</h2>`;
    const row = document.createElement("div");
    row.className = "style-row";
    STYLES.filter((style) => style.group === group).forEach((style) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "view-btn";
      button.dataset.style = style.id;
      button.textContent = style.label;
      button.classList.toggle("is-active", style.id === styleId);
      button.addEventListener("click", () => setStyle(style.id));
      row.append(button);
    });
    block.append(row);
    styleNav.append(block);
  });

  count.textContent = `${STYLES.length} styles · ${ANGLES.length} angle`;
}

function holdStage() {
  teardown?.();
  teardown = null;
  stage.replaceChildren();
  const wait = document.createElement("div");
  wait.className = "panel loading";
  wait.textContent = "Same toilet incoming.";
  stage.append(wait);
}

async function show() {
  const id = (requestId += 1);
  const style = styleById(styleId);
  caption.textContent = style.caption;
  hint.textContent = style.hint;
  renderPicker();
  cancelAnimationFrame(flushWatch);
  flushWatch = 0;
  flush.reset();
  holdStage();

  let mount;
  if (style.kind === "image") mount = mountImage;
  if (style.kind === "filter") mount = mountFilter;
  if (style.kind === "scene") mount = await scenes[style.scene]();
  if (id !== requestId) return;

  stage.replaceChildren();
  teardown = mount(stage, { angleId, style, flush });
  setFlushReady();
}

function setFlushReady() {
  flushBtn.disabled = false;
  flushBtn.textContent = "Flush";
  flushStatus.textContent = "Click the bowl or press Flush.";
}

function watchFlush() {
  if (!flush.running) {
    setFlushReady();
    flushWatch = 0;
    return;
  }
  flushBtn.disabled = true;
  flushBtn.textContent = "Flushing";
  flushStatus.textContent = "Handle, seat, lid, swirl, refill.";
  flushWatch = requestAnimationFrame(watchFlush);
}

function setStyle(next) {
  if (next === styleId) return;
  styleId = next;
  show();
}

function setAngle(next) {
  if (next === angleId) return;
  angleId = next;
  show();
}

flushBtn.addEventListener("click", () => flush.start());
window.addEventListener("keydown", (event) => {
  if (event.code === "Space" && event.target.tagName !== "BUTTON") {
    event.preventDefault();
    flush.start();
  }
});
flush.onStart(() => {
  if (!flushWatch) flushWatch = requestAnimationFrame(watchFlush);
});

renderPicker();
show();
