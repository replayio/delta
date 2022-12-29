import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

export function diffImages(img1, img2) {
  try {
    const png1 = PNG.sync.read(img1);
    const png2 = PNG.sync.read(img2);
    const { width, height } = png1;
    const diff = new PNG({ width, height });

    const numDiffPixels = pixelmatch(
      png1.data,
      png2.data,
      diff.data,
      width,
      height,
      {
        threshold: 0.2,
      }
    );

    const diffPng = PNG.sync.write(diff);
    const changed = numDiffPixels > 0;
    console.log({ numDiffPixels });

    return { changed, numDiffPixels, diffPng };
  } catch (e) {
    console.log("error", e);
    return { changed: true };
  }
}

export function diffBase64Images(img1, img2) {
  if (!img1 || !img2) {
    return { changed: false };
  }
  return diffImages(Buffer.from(img1, "base64"), Buffer.from(img2, "base64"));
}
