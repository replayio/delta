import { readFileSync, writeFileSync } from "fs";
import { diffImages } from "../lib/server/diff";

(() => {
  const fileName = "point-panel-default-badge.png";
  const image1Buffer = readFileSync("1-" + fileName);
  const image2Buffer = readFileSync("2-" + fileName);

  const diffImg = diffImages(image1Buffer, image2Buffer);

  writeFileSync(`diff-${fileName}`, diffImg);
})();
