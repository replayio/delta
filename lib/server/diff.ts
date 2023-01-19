import { subClass } from "gm";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const imageMagick = subClass({ imageMagick: true });

function cropImage(img, width, height) {
  return new Promise((resolve, reject) => {
    imageMagick(img)
      .crop(width, height, 0, 0)
      .toBuffer("png", function (err, buffer) {
        if (err) reject(err);

        try {
          const png = PNG.sync.read(buffer);
          resolve(png);
        } catch (e) {
          console.log(`cropImage: error`, e, buffer, width, height);
          reject(e);
        }
      });
  });
}

async function resizeImage(png1, png2, img1, img2) {
  console.log(
    "resizeImage\nimg1:",
    img1,
    "\nimg2:",
    img2,
    "\npng1:",
    png1,
    "\npng2:",
    png2
  );
  try {
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
  } catch (e) {
    console.log(`resizeImage: error`, e);
    throw e;
  }
}

export async function diffImages(img1, img2) {
  try {
    let png1 = PNG.sync.read(img1);
    let png2 = PNG.sync.read(img2);

    if (png1.width !== png2.width || png1.height !== png2.height) {
      console.log(
        `diffImages: resizing images (${png1.width}, ${png1.height}) (${png2.width}, ${png2.height})`
      );
      try {
        ({ png1, png2 } = await resizeImage(png1, png2, img1, img2));
      } catch (e) {
        console.log(`diffImages: resizeImage error`, e);
        return { error: e, changed: true, numPixels: 0, png: null };
      }
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
    console.log(`diffImages: final error`, e);
    return { error: e, changed: true, numPixels: 0, png: null };
  }
}

export function diffBase64Images(img1, img2) {
  if (!img1 || !img2) {
    console.log(`diffBase64Images: bailing because one of the images is null`);
    return { changed: false, error: null, png: null, numPixels: 0 };
  }
  return diffImages(Buffer.from(img1, "base64"), Buffer.from(img2, "base64"));
}
