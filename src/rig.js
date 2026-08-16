// Normalized 0-1 regions for the shared three-quarter photo.
export const THREE_QUARTER = {
  handle: {
    cx: 0.355,
    cy: 0.328,
    rx: 0.07,
    ry: 0.026,
    tilt: -0.16,
    pivotX: 0.412,
    pivotY: 0.328,
  },
  lid: {
    cx: 0.528,
    cy: 0.5,
    rx: 0.205,
    ry: 0.132,
    tilt: -0.42,
    hingeX: 0.455,
    hingeY: 0.392,
  },
  seat: {
    cx: 0.535,
    cy: 0.515,
    rx: 0.188,
    ry: 0.118,
    tilt: -0.42,
    hingeX: 0.46,
    hingeY: 0.4,
  },
  bowl: {
    cx: 0.54,
    cy: 0.528,
    rx: 0.155,
    ry: 0.1,
    tilt: -0.42,
  },
};

export function rigFor(_angleId) {
  return THREE_QUARTER;
}
