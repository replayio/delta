import { subClass } from "gm";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const imageMagick = subClass({ imageMagick: true });

function cropImage(image, width, height) {
  return new Promise((resolve, reject) => {
    imageMagick(image)
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

async function resizeImage(png1, png2, image1, image2) {
  console.log(
    "resizeImage\nimage1:",
    image1,
    "\nimage2:",
    image2,
    "\npng1:",
    png1,
    "\npng2:",
    png2
  );
  try {
    if (png1.width > png2.width) {
      console.log(
        `resizeImage: resizing image1 width from ${png1.width} to ${png2.width}`
      );
      png1 = await cropImage(image1, png2.width, png1.height);
    }

    if (png2.width > png1.width) {
      console.log(
        `resizeImage: resizing image2 width from ${png2.width} to ${png1.width}`
      );
      png2 = await cropImage(image2, png1.width, png2.height);
    }

    if (png1.height > png2.height) {
      console.log(
        `resizeImage: resizing image1 height from ${png1.height} to ${png2.height}`
      );
      png1 = await cropImage(image1, png1.width, png2.height);
    }

    if (png2.height > png1.height) {
      console.log(
        `resizeImage: resizing image2 height from ${png2.height} to ${png1.height}`
      );
      png2 = await cropImage(image2, png2.width, png1.height);
    }

    return { png1, png2 };
  } catch (e) {
    console.log(`resizeImage: error`, e);
    throw e;
  }
}

type ImageDiff = {
  changed: boolean;
  error: Error | null;
  numPixels: number | null;
  png: Buffer | null;
};

export async function diffImages(image1, image2): Promise<ImageDiff> {
  try {
    let png1 = PNG.sync.read(image1);
    let png2 = PNG.sync.read(image2);

    if (png1.width !== png2.width || png1.height !== png2.height) {
      console.log(
        `diffImages: resizing images (${png1.width}, ${png1.height}) (${png2.width}, ${png2.height})`
      );
      try {
        ({ png1, png2 } = await resizeImage(png1, png2, image1, image2));
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
    return {
      changed,
      error: null,
      numPixels,
      png: diffPng,
    };
  } catch (error) {
    return {
      changed: false,
      error,
      numPixels: 0,
      png: null,
    };
  }
}

export function diffBase64Images(image1, image2) {
  if (!image1 || !image2) {
    console.log(`diffBase64Images: bailing because one of the images is null`);
    return { changed: false, error: null, png: null, numPixels: 0 };
  }
  return diffImages(
    Buffer.from(image1, "base64"),
    Buffer.from(image2, "base64")
  );
}
