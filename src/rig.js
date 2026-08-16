// Normalized 0-1 regions for the shared three-quarter photo.
export const THREE_QUARTER = {
  handle: {
    cx: 0.348,
    cy: 0.328,
    rx: 0.058,
    ry: 0.02,
    tilt: -0.18,
    pivotX: 0.392,
    pivotY: 0.328,
  },
  lid: {
    cx: 0.548,
    cy: 0.508,
    rx: 0.198,
    ry: 0.122,
    tilt: -0.38,
    hingeX: 0.486,
    hingeY: 0.392,
  },
  bowl: {
    cx: 0.558,
    cy: 0.528,
    rx: 0.142,
    ry: 0.09,
    tilt: -0.38,
  },
};

export function rigFor(_angleId) {
  return THREE_QUARTER;
}
