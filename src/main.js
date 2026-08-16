import "./style.css";
import { mountAscii } from "./ascii.js";
import { mountImage } from "./image.js";
import { mountModel } from "./model3d.js";
import { mountPixel } from "./pixel.js";
import { mountVoxels } from "./voxels.js";

const CAPTIONS = {
  ascii: ["Monospace throne", "Select text to copy. Flush later."],
  pixel: ["32×32 porcelain", "Crisp pixels. Soft seat."],
  image: ["Studio still", "A photograph of nothing but the bowl."],
  model: ["Sculpted porcelain", "Drag to orbit. Scroll to lean in."],
  voxels: ["Cubic commode", "Every cube is empty. For now."],
};

const mounts = {
  ascii: mountAscii,
  pixel: mountPixel,
  image: mountImage,
  model: mountModel,
  voxels: mountVoxels,
};

const stage = document.querySelector("#stage");
const caption = document.querySelector("#caption");
const hint = document.querySelector("#hint");
const buttons = [...document.querySelectorAll(".view-btn")];

let current = "ascii";
let teardown = mountAscii(stage);

function show(view) {
  if (view === current) return;
  teardown?.();
  current = view;
  teardown = mounts[view](stage);
  const [title, note] = CAPTIONS[view];
  caption.textContent = title;
  hint.textContent = note;
  buttons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === view);
  });
}

buttons.forEach((button) => {
  button.addEventListener("click", () => show(button.dataset.view));
});
