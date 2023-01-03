import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import gm from "gm";
import fs from "fs";

const imageMagick = gm.subClass({ imageMagick: true });

function cropImage(img, width, height) {
  return new Promise((resolve, reject) => {
    imageMagick(img)
      .crop(width, height, 0, 0)
      .toBuffer("png", function (err, buffer) {
        if (err) reject(err);
        resolve(PNG.sync.read(buffer));
      });
  });
}

async function resizeImage(png1, png2, img1, img2) {
  if (png1.width > png2.width) {
    console.log(
      `resizeImage: resizing img1 width from ${png1.width} to ${png2.width}`
    );
    png1 = await cropImage(img1, png2.width, png1.height);
  }

  if (png2.width > png1.width) {
    console.log(
      `resizeImage: resizing img2 width from ${png2.width} to ${png1.width}`
    );
    png2 = await cropImage(img2, png1.width, png2.height);
  }

  if (png1.height > png2.height) {
    console.log(
      `resizeImage: resizing img1 height from ${png1.height} to ${png2.height}`
    );
    png1 = await cropImage(img1, png1.width, png2.height);
  }

  if (png2.height > png1.height) {
    console.log(
      `resizeImage: resizing img2 height from ${png2.height} to ${png1.height}`
    );
    png2 = await cropImage(img2, png2.width, png1.height);
  }

  return { png1, png2 };
}

export async function diffImages(img1, img2) {
  try {
    let png1 = PNG.sync.read(img1);
    let png2 = PNG.sync.read(img2);

    if (png1.width !== png2.width || png1.height !== png2.height) {
      console.log(
        `diffImages: resizing images (${png1.width}, ${png1.height}) (${png2.width}, ${png2.height})`
      );
      ({ png1, png2 } = await resizeImage(png1, png2, img1, img2));
    }

    console.log(
      `diffImages: resized images (${png1.width}, ${png1.height}) (${png2.width}, ${png2.height})`
    );
    const diff = new PNG({ width: png1.width, height: png1.height });

    const numPixels = pixelmatch(
      png1.data,
      png2.data,
      diff.data,
      png1.width,
      png2.height,
      {
        threshold: 0.2,
      }
    );

    const diffPng = PNG.sync.write(diff);
    const changed = numPixels > 0;
    console.log(`diffImages:`, { changed, numPixels });
    return { changed, numPixels, png: diffPng, error: null };
  } catch (e) {
    return { error: e };
  }
}

export function diffBase64Images(img1, img2) {
  if (!img1 || !img2) {
    console.log(`diffBase64Images: bailing because one of the images is null`);
    return { changed: false, error: null, png: null, numPixels: 0 };
  }
  return diffImages(Buffer.from(img1, "base64"), Buffer.from(img2, "base64"));
}
