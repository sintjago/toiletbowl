// Measured from the canonical three-quarter photo (1024²).
export const THREE_QUARTER = {
  handle: {
    cx: 0.345,
    cy: 0.312,
    rx: 0.055,
    ry: 0.02,
    tilt: -0.12,
    pivotX: 0.398,
    pivotY: 0.312,
  },
  lid: {
    cx: 0.645,
    cy: 0.508,
    rx: 0.215,
    ry: 0.09,
    tilt: -0.38,
    hingeX: 0.52,
    hingeY: 0.412,
  },
  seat: {
    cx: 0.645,
    cy: 0.515,
    rx: 0.195,
    ry: 0.08,
    tilt: -0.38,
    hingeX: 0.528,
    hingeY: 0.42,
  },
  bowl: {
    cx: 0.648,
    cy: 0.518,
    rx: 0.152,
    ry: 0.07,
    tilt: -0.38,
  },
};

export function rigFor(_angleId) {
  return THREE_QUARTER;
}
