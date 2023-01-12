import { readdirSync, readFileSync, statSync } from "fs";
import chunk from "lodash/chunk";

import { fetchURI } from "../utils/fetchURI";

function getFiles(dir: string): string[] {
  // Use the readdirSync() method to get a list of files in the directory
  const files = readdirSync(dir);

  // Create an empty array to store the list of all files
  const allFiles: string[] = [];

  files.forEach((file) => {
    const stats = statSync(`${dir}/${file}`);

    if (stats.isDirectory()) {
      allFiles.push(...getFiles(`${dir}/${file}`));
    } else {
      if (file !== ".DS_Store") {
        allFiles.push(`${dir}/${file}`);
      }
    }
  });

  // Return the list of all files
  return allFiles;
}

async function uploadImage(file: string, projectId: string, branch: string) {
  const content = readFileSync(file, { encoding: "base64" });
  const image = { content, file };

  return await fetchURI("http://localhost:3000/api/uploadSnapshot", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image, projectId, branch }),
  });
}

(async () => {
  const allFiles = getFiles("./playwright/visuals").slice(0, 100);
  console.log(allFiles);

  const projectId = "dcb5df26-b418-4fe2-9bdf-5a838e604ec4";
  const branch = "visuals10";
  let results = [];
  for (const files of chunk(allFiles, 20)) {
    const res = await Promise.all(
      files.map((file) => uploadImage(file, projectId, branch))
    );
    const failedCount = res.filter((r) => r?.error).length;
    const passCount = res.filter((r) => r?.data).length;
    console.log(`uploaded ${passCount} images`);

    if (failedCount > 0) {
      console.log(`failed to uploaded ${failedCount} images`);
    }
    results.push(...res);
  }

  console.log(
    JSON.stringify(
      results.filter((r) => r?.data).map((r) => r?.data),
      null,
      2
    )
  );
  console.log("---");

  console.log(
    JSON.stringify(
      results.filter((r) => r?.error).map((r) => r?.error),
      null,
      2
    )
  );
})();
