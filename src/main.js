import "./style.css";
import { mountAscii } from "./ascii.js";
import { mountImage } from "./image.js";
import { mountPixel } from "./pixel.js";

const CAPTIONS = {
  ascii: ["Monospace throne", "Select text to copy. Flush later."],
  pixel: ["32×32 porcelain", "Crisp pixels. Soft seat."],
  image: ["Studio still", "A photograph of nothing but the bowl."],
  model: ["Sculpted porcelain", "Drag to orbit. Scroll to lean in."],
  voxels: ["Cubic commode", "Every cube is empty. For now."],
};

const mounts = {
  ascii: () => Promise.resolve(mountAscii),
  pixel: () => Promise.resolve(mountPixel),
  image: () => Promise.resolve(mountImage),
  model: () => import("./model3d.js").then((mod) => mod.mountModel),
  voxels: () => import("./voxels.js").then((mod) => mod.mountVoxels),
};

const stage = document.querySelector("#stage");
const caption = document.querySelector("#caption");
const hint = document.querySelector("#hint");
const buttons = [...document.querySelectorAll(".view-btn")];

let current = "ascii";
let teardown = mountAscii(stage);
let requestId = 0;

async function show(view) {
  if (view === current) return;
  const id = (requestId += 1);
  current = view;
  const [title, note] = CAPTIONS[view];
  caption.textContent = title;
  hint.textContent = note;
  buttons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === view);
  });
  const mount = await mounts[view]();
  if (id !== requestId) return;
  teardown?.();
  teardown = mount(stage);
}

buttons.forEach((button) => {
  button.addEventListener("click", () => show(button.dataset.view));
});
