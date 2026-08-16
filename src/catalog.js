export const ANGLES = [
  {
    id: "three-quarter",
    label: "Three-quarter",
    camera: { position: [2.62, 1.88, 3.08], target: [0, 0.92, 0.06] },
  },
];

const image = (id, group, label, file, caption, hint) => ({
  id,
  group,
  label,
  kind: "image",
  file,
  caption,
  hint,
});

const filter = (id, group, label, name, caption, hint) => ({
  id,
  group,
  label,
  kind: "filter",
  filter: name,
  caption,
  hint,
});

const scene = (id, group, label, name, caption, hint) => ({
  id,
  group,
  label,
  kind: "scene",
  scene: name,
  caption,
  hint,
});

export const STYLES = [
  image("photo", "Lens", "Photo", "photo.png", "Studio still", "The canonical bowl. Every other style copies this pose."),
  filter("pixel", "Signal", "Pixel", "pixel", "Photo, chunked", "Same picture, fewer squares."),
  filter("ascii", "Signal", "ASCII", "ascii", "Photo, typed", "Same picture, made of characters."),
  filter("dither", "Signal", "Dither", "dither", "Ordered dither", "Same picture, Bayer dots."),
  filter("gameboy", "Signal", "Game Boy", "gameboy", "Four greens", "Same picture, pocket console."),
  filter("posterize", "Signal", "Posterize", "posterize", "Flat inks", "Same picture, fewer paints."),
  filter("edges", "Signal", "Contour", "edges", "Edge find", "Same picture, only the lines."),
  filter("duotone", "Signal", "Duotone", "duotone", "Mint and cream", "Same picture, two inks."),
  filter("crt", "Signal", "CRT", "crt", "Scanlines", "Same picture, old glass."),
  scene("model", "Form", "3D Porcelain", "porcelain", "Sculpted copy", "Same three-quarter lock. No orbit."),
  scene("wireframe", "Form", "Wireframe", "wireframe", "Line cage", "Same mesh, same camera."),
  scene("lowpoly", "Form", "Low-poly", "lowpoly", "Fewer facets", "Same toilet, cheaper clay."),
  scene("voxels", "Form", "Voxels", "voxels", "Cubic copy", "Same pose, stacked cubes."),
  image("watercolor", "Paint", "Watercolor", "watercolor.png", "Wet paper", "Same angle, pigment blooms."),
  image("oil", "Paint", "Oil", "oil.png", "Impasto", "Same angle, thick paint."),
  image("impressionist", "Paint", "Impressionist", "impressionist.png", "Broken color", "Same angle, short dabs."),
  image("pastel", "Paint", "Pastel", "pastel.png", "Chalk dust", "Same angle, soft sticks."),
  image("pointillism", "Paint", "Pointillism", "pointillism.png", "Dot field", "Same angle, tiny spots."),
  image("pop-art", "Paint", "Pop art", "pop-art.png", "Hard graphic", "Same angle, louder ink."),
  image("airbrush", "Paint", "Airbrush", "airbrush.png", "Soft spray", "Same angle, 80s gloss."),
  image("pencil", "Drawn", "Pencil", "pencil.png", "Graphite", "Same angle, hatched."),
  image("charcoal", "Drawn", "Charcoal", "charcoal.png", "Soft black", "Same angle, smudged."),
  image("comic", "Drawn", "Comic", "comic.png", "Ink and flats", "Same angle, panel-ready."),
  image("blueprint", "Drawn", "Blueprint", "blueprint.png", "Working drawing", "Same angle, measured."),
  image("marker", "Drawn", "Marker", "marker.png", "Felt-tip comp", "Same angle, marker bleed."),
  image("tattoo", "Drawn", "Tattoo flash", "tattoo.png", "Shop flash", "Same angle, bold flash."),
  image("sumie", "Drawn", "Sumi-e", "sumie.png", "Ink wash", "Same angle, one brush."),
  image("woodcut", "Print", "Woodcut", "woodcut.png", "Carved block", "Same angle, gouge marks."),
  image("etching", "Print", "Etching", "etching.png", "Copper plate", "Same angle, bitten lines."),
  image("risograph", "Print", "Risograph", "risograph.png", "Two inks", "Same angle, slightly off-register."),
  image("halftone", "Print", "Halftone", "halftone.png", "Newsprint", "Same angle, rosette dots."),
  image("ukiyoe", "Print", "Ukiyo-e", "ukiyoe.png", "Woodblock", "Same angle, mineral pigments."),
  image("art-nouveau", "Print", "Art Nouveau", "art-nouveau.png", "Sinuous line", "Same angle, ornamental."),
  image("constructivist", "Print", "Constructivist", "constructivist.png", "Poster geometry", "Same angle, red and black."),
  image("mezzotint", "Print", "Mezzotint", "mezzotint.png", "Velvet black", "Same angle, rocked plate."),
  image("lithograph", "Print", "Lithograph", "lithograph.png", "Grease on stone", "Same angle, tusche wash."),
  image("cyanotype", "Print", "Cyanotype", "cyanotype.png", "Sun print", "Same photo, Prussian blue. Not a blueprint."),
  image("stained-glass", "Craft", "Stained glass", "stained-glass.png", "Lead and light", "Same angle, glowing panes."),
  image("cross-stitch", "Craft", "Cross-stitch", "cross-stitch.png", "Aida cloth", "Same angle, little Xes."),
  image("mosaic", "Craft", "Mosaic", "mosaic.png", "Tesserae", "Same angle, stone chips."),
  image("clay", "Craft", "Clay", "clay.png", "Fingerprints", "Same angle, polymer clay."),
  image("lego", "Craft", "LEGO", "lego.png", "Brick build", "Same angle, studs up."),
  image("origami", "Craft", "Origami", "origami.png", "Folded paper", "Same angle, creases."),
  image("papercut", "Craft", "Papercut", "papercut.png", "Stacked sheets", "Same angle, cut layers."),
  image("felt", "Craft", "Felt", "felt.png", "Wool applique", "Same angle, blanket stitch."),
  image("sticker", "Craft", "Sticker", "sticker.png", "Die-cut vector", "Same angle, peelable."),
  image("storybook", "Craft", "Storybook", "storybook.png", "Gouache page", "Same angle, gentle."),
  image("batik", "Craft", "Batik", "batik.png", "Wax resist", "Same angle, crackle dye."),
  image("quilt", "Craft", "Quilt", "quilt.png", "Pieced cloth", "Same angle, stitched patches."),
  image("enamel", "Craft", "Enamel", "enamel.png", "Cloisonné", "Same angle, fired glass."),
  image("bronze-relief", "Craft", "Bronze relief", "bronze-relief.png", "Cast plaque", "Same angle, low relief."),
  image("embroidery", "Craft", "Embroidery", "embroidery.png", "Linen sampler", "Same angle, satin stitch."),
  image("neon", "Light", "Neon", "neon.png", "Night tubes", "Same angle, after hours."),
  image("vhs", "Light", "VHS", "vhs.png", "Paused tape", "Same angle, tracking noise."),
  image("lcd", "Light", "LCD", "lcd.png", "Green-gray glass", "Same angle, pixel grid."),
  image("thermal", "Signal", "Thermal", "thermal.png", "Receipt print", "Same toilet, cheap paper."),
  image("icon", "Signal", "Icon", "icon.png", "App glyph", "Same angle, fewer lines."),
  image("cubism", "Form", "Cubism", "cubism.png", "Fractured bowl", "Same toilet, several glances at once."),
  image("isometric", "Form", "Isometric", "isometric.png", "Axonometric", "Same toilet, no vanishing point. Best effort."),
];

export const GROUPS = [...new Set(STYLES.map((style) => style.group))];

export function styleById(id) {
  return STYLES.find((style) => style.id === id);
}

export function angleById(id) {
  return ANGLES.find((angle) => angle.id === id);
}

export function imagePath(angleId, file) {
  return `./toilets/${angleId}/${file}`;
}
