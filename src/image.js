export function mountImage(root) {
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="image-frame">
      <img src="./toilet.png" alt="A clean white porcelain toilet, lid closed, no shit yet." />
    </div>
  `;
  root.append(panel);
  return () => panel.remove();
}
