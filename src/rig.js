// Normalized 0-1 regions for the shared three-quarter photo.
export const THREE_QUARTER = {
  handle: {
    cx: 0.36,
    cy: 0.332,
    rx: 0.072,
    ry: 0.028,
    tilt: -0.16,
    pivotX: 0.418,
    pivotY: 0.332,
  },
  lid: {
    cx: 0.534,
    cy: 0.515,
    rx: 0.23,
    ry: 0.145,
    tilt: -0.34,
    hingeX: 0.47,
    hingeY: 0.405,
  },
  bowl: {
    cx: 0.545,
    cy: 0.54,
    rx: 0.168,
    ry: 0.108,
    tilt: -0.34,
  },
};

export function rigFor(_angleId) {
  return THREE_QUARTER;
}
