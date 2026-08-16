import { mountPicture } from "./picture.js";

export function mountFilter(root, { angleId, style, flush }) {
  return mountPicture(root, {
    filter: style.filter,
    flush,
    angleId,
  });
}
