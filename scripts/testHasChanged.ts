import fetch from "node-fetch";
import { config } from "dotenv";
import { writeFileSync } from "fs";

import { diffImages } from "../lib/server/diff";

config({ path: "./.env.local" });

async function get(path: string) {
  const response = await fetch(`${process.env.HOST}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status === 200) {
    const json = await response.json();
    return json;
  }

  const text = await response.text();

  return {
    error: text,
    status: response.status,
  };
}

(async () => {
  const hasChanged = (await get(
    encodeURI(`/api/hasChanged?branch=visuals5&primaryBranch=main-2`)
  )) as any;

  for (const snapshot of hasChanged.snapshots) {
    const { image: image1 } = (await get(
      encodeURI(`/api/downloadSnapshot?path=${snapshot.path}`)
    )) as any;
    const { image: image2 } = (await get(
      encodeURI(`/api/downloadSnapshot?path=${snapshot.mainSnapshot.path}`)
    )) as any;

    const image1Buffer = Buffer.from(image1, "base64");
    const image2Buffer = Buffer.from(image2, "base64");

    const diffImg = diffImages(image1Buffer, image2Buffer);
    const fileName = snapshot.file.split("/").pop();
    writeFileSync(`diff-${fileName}`, diffImg);
    writeFileSync(fileName, image1Buffer);
  }
})();
