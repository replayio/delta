const fs = require("fs");
const { diffImages } = require("../lib/diff");

(() => {
  const fileName = "point-panel-default-badge.png";
  const image1Buffer = fs.readFileSync("1-" + fileName);
  const image2Buffer = fs.readFileSync("2-" + fileName);

  const diffImg = diffImages(image1Buffer, image2Buffer);
  fs.writeFileSync(`diff-${fileName}`, diffImg);
})();
