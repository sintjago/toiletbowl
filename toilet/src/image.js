import { imagePath } from "./catalog.js";
import { mountPicture } from "./picture.js";

export function mountImage(root, { angleId, style, flush }) {
  return mountPicture(root, {
    src: imagePath(angleId, style.file),
    flush,
    angleId,
  });
}
