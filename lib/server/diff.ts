import { subClass } from "gm";
import pixelmatch from "pixelmatch";
import { PNG, PNGWithMetadata } from "pngjs";

const imageMagick = subClass({ imageMagick: true });

function cropImage(
  buffer: Buffer,
  width: number,
  height: number
): Promise<PNGWithMetadata> {
  return new Promise((resolve, reject) => {
    imageMagick(buffer)
      .crop(width, height, 0, 0)
      .toBuffer("png", function (error, buffer) {
        if (error) {
          reject(error);
        }

        try {
          const png = PNG.sync.read(buffer);
          resolve(png);
        } catch (error) {
          console.log(`cropImage: error`, error, buffer, width, height);
          reject(error);
        }
      });
  });
}

async function resizeImage(
  pngA: PNGWithMetadata,
  pngB: PNGWithMetadata,
  bufferA: Buffer,
  bufferB: Buffer
) {
  console.log(
    "resizeImage\nimage1:",
    bufferA,
    "\nimage2:",
    bufferB,
    "\npngA:",
    pngA,
    "\npngB:",
    pngB
  );
  try {
    if (pngA.width > pngB.width) {
      console.log(
        `resizeImage: resizing image1 width from ${pngA.width} to ${pngB.width}`
      );
      pngA = await cropImage(bufferA, pngB.width, pngA.height);
    }

    if (pngB.width > pngA.width) {
      console.log(
        `resizeImage: resizing image2 width from ${pngB.width} to ${pngA.width}`
      );
      pngB = await cropImage(bufferB, pngA.width, pngB.height);
    }

    if (pngA.height > pngB.height) {
      console.log(
        `resizeImage: resizing image1 height from ${pngA.height} to ${pngB.height}`
      );
      pngA = await cropImage(bufferA, pngA.width, pngB.height);
    }

    if (pngB.height > pngA.height) {
      console.log(
        `resizeImage: resizing image2 height from ${pngB.height} to ${pngA.height}`
      );
      pngB = await cropImage(bufferB, pngB.width, pngA.height);
    }

    return { pngA, pngB };
  } catch (error) {
    console.log(`resizeImage: error`, error);
    throw error;
  }
}

type ImageDiff = {
  changed: boolean;
  error: Error | null;
  numPixels: number | null;
  png: Buffer | null;
};

export async function diffBase64Images(imageA: string, imageB: string) {
  const bufferA = imageA ? Buffer.from(imageA, "base64") : null;
  const bufferB = imageB ? Buffer.from(imageB, "base64") : null;

  if (!bufferA || !bufferB) {
    console.log(`diffBase64Images: bailing because one of the images is null`);

    return {
      changed: true,
      error: null,
      numPixels: bufferA?.length ?? bufferB?.length ?? 0,
      png: null,
    };
  }

  return await diffImages(bufferA, bufferB);
}

export async function diffImages(
  bufferA: Buffer,
  bufferB: Buffer
): Promise<ImageDiff> {
  try {
    let pngA = PNG.sync.read(bufferA);
    let pngB = PNG.sync.read(bufferB);

    if (pngA.width !== pngB.width || pngA.height !== pngB.height) {
      console.log(
        `diffImages: resizing images (${pngA.width}, ${pngA.height}) (${pngB.width}, ${pngB.height})`
      );
      try {
        ({ pngA, pngB } = await resizeImage(pngA, pngB, bufferA, bufferB));
      } catch (e) {
        console.log(`diffImages: resizeImage error`, e);
        return { error: e, changed: true, numPixels: 0, png: null };
      }
    }

    console.log(
      `diffImages: resized images (${pngA.width}, ${pngA.height}) (${pngB.width}, ${pngB.height})`
    );
    const diff = new PNG({ width: pngA.width, height: pngA.height });

    const numPixels = pixelmatch(
      pngA.data,
      pngB.data,
      diff.data,
      pngA.width,
      pngB.height,
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
