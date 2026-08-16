const TOILET = String.raw`
                 ________________
                /                \
               |   .----------.   |
               |  |            |  |
               |  |   TANK     |  |
               |  |            |  |
               |   '----------'   |
               |        []        |
               |__________________|
              /                    \
             /     ____________     \
            |     /            \     |
            |    |    .----.    |    |
            |    |   /      \   |    |
            |    |  |  ~~~~  |  |    |
            |    |   \      /   |    |
            |    |    '----'    |    |
            |     \____________/     |
             \                      /
              \____________________/
                     ||    ||
                     ||    ||
                     ''    ''
`;

export function mountAscii(root) {
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `<div class="ascii-wrap"><pre class="ascii-art">${TOILET.trimEnd()}</pre></div>`;
  root.append(panel);
  return () => panel.remove();
}
