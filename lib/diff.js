const PNG = require("pngjs").PNG;
const pixelmatch = require("pixelmatch");

function diffImages(img1, img2) {
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

  console.log({ numDiffPixels });
  const diffPng = PNG.sync.write(diff);

  return diffPng;
}

module.exports = { diffImages };
