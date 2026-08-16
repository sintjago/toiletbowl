import { imagePath } from "./catalog.js";

export function mountImage(root, { angleId, style }) {
  const panel = document.createElement("div");
  panel.className = "panel";
  const src = imagePath(angleId, style.file);
  panel.innerHTML = `
    <div class="image-frame">
      <img src="${src}" alt="${style.label} toilet, same three-quarter pose, lid closed." />
    </div>
  `;
  root.append(panel);
  return () => panel.remove();
}
