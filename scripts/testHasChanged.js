const fetch = require("node-fetch");
const dotenv = require("dotenv");
const { diffImages } = require("../lib/server/diff");
const fs = require("fs");

dotenv.config({ path: "./.env.local" });

async function get(path) {
  const res = await fetch(`${process.env.HOST}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (res.status === 200) {
    return res.json();
  }

  return { status: res.status, error: await res.text() };
}

(async () => {
  const hasChanged = await get(
    encodeURI(`/api/hasChanged?branch=visuals5&primaryBranch=main-2`)
  );

  for (const snapshot of hasChanged.snapshots) {
    const { image: image1 } = await get(
      encodeURI(`/api/downloadSnapshot?path=${snapshot.path}`)
    );
    const { image: image2 } = await get(
      encodeURI(`/api/downloadSnapshot?path=${snapshot.mainSnapshot.path}`)
    );

    const image1Buffer = Buffer.from(image1, "base64");
    const image2Buffer = Buffer.from(image2, "base64");

    const diffImg = diffImages(image1Buffer, image2Buffer);
    const fileName = snapshot.file.split("/").pop();
    fs.writeFileSync(`diff-${fileName}`, diffImg);
    fs.writeFileSync(fileName, image1Buffer);
  }
})();
