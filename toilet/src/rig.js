// Measured from the canonical three-quarter photo (1024²).
// The lid oval sits right of center; the chrome handle is on the tank, not the bowl.
export const THREE_QUARTER = {
  handle: {
    cx: 0.31,
    cy: 0.17,
    rx: 0.045,
    ry: 0.014,
    tilt: 0.02,
    pivotX: 0.355,
    pivotY: 0.17,
  },
  lid: {
    cx: 0.575,
    cy: 0.445,
    rx: 0.225,
    ry: 0.068,
    tilt: 0.28,
    hingeX: 0.39,
    hingeY: 0.392,
  },
  seat: {
    cx: 0.582,
    cy: 0.462,
    rx: 0.205,
    ry: 0.078,
    tilt: 0.28,
    hingeX: 0.4,
    hingeY: 0.4,
  },
  bowl: {
    cx: 0.585,
    cy: 0.46,
    rx: 0.155,
    ry: 0.055,
    tilt: 0.28,
  },
};

export function rigFor(_angleId) {
  return THREE_QUARTER;
}
