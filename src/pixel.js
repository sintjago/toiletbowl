const P = {
  _: null,
  k: "#16332f",
  w: "#f7f3ea",
  p: "#fffdf8",
  s: "#d9d2c4",
  b: "#7aa8b8",
  d: "#4d7d8c",
  c: "#c9d4d1",
  f: "#e27d4a",
  t: "#8fb8ae",
  g: "#d7efe8",
};

// 32x32 throne. Legend lives in P.
const SPRITE = [
  "________________________________",
  "________________________________",
  "__________kkkkkkkkkk____________",
  "_________kwppppppppwk___________",
  "________kwppffffffppwk__________",
  "________kwppffffffppwk__________",
  "________kwppppppppppwk__________",
  "________kwppppccppppwk__________",
  "________kwwsssssssswwk__________",
  "_______kkkkkkkkkkkkkkkk_________",
  "______kwppppppppppppppwk________",
  "_____kwppssssssssssssppwk_______",
  "____kwppssppppppppppssppwk______",
  "____kwpssppbbbbbbbbppsspw_______",
  "____kwpsppbbddddddbbppspw_______",
  "____kwpsppbbd~~~~dbbppspw_______",
  "____kwpsppbbddddddbbppspw_______",
  "____kwpssppbbbbbbbbppsspw_______",
  "____kwppssppppppppppssppwk______",
  "_____kwppssssssssssssppwk_______",
  "______kwppppppppppppppwk________",
  "_______kwwsssssssssswwk_________",
  "________kkkkkkkkkkkkkk__________",
  "__________kk______kk____________",
  "__________ks______sk____________",
  "__________kssssssssk____________",
  "___________kkkkkkkk_____________",
  "________________________________",
  "gggggggggggggggggggggggggggggggg",
  "tttttttttttttttttttttttttttttttt",
  "gggggggggggggggggggggggggggggggg",
  "tttttttttttttttttttttttttttttttt",
].map((row) => row.replaceAll("~", "d"));

export function mountPixel(root) {
  const panel = document.createElement("div");
  panel.className = "panel";
  const canvas = document.createElement("canvas");
  canvas.className = "pixel-canvas";
  panel.append(canvas);
  root.append(panel);

  const ctx = canvas.getContext("2d");
  const draw = () => {
    const dpr = window.devicePixelRatio || 1;
    const width = panel.clientWidth;
    const height = panel.clientHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = "#eef6f3";
    ctx.fillRect(0, 0, width, height);

    const size = SPRITE.length;
    const cell = Math.floor(Math.min(width, height) / (size + 4));
    const ox = Math.floor((width - cell * size) / 2);
    const oy = Math.floor((height - cell * size) / 2);

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const color = P[SPRITE[y][x]];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);
      }
    }
  };

  draw();
  const observer = new ResizeObserver(draw);
  observer.observe(panel);
  return () => {
    observer.disconnect();
    panel.remove();
  };
}
