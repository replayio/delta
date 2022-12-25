const fs = require("fs");
const fetch = require("node-fetch");
const chunk = require("lodash/chunk");

function getFiles(dir) {
  // Use the fs.readdirSync() method to get a list of files in the directory
  const files = fs.readdirSync(dir);

  // Create an empty array to store the list of all files
  const allFiles = [];

  files.forEach((file) => {
    const stats = fs.statSync(`${dir}/${file}`);

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

async function uploadImage(file, projectId, branch) {
  const content = fs.readFileSync(file, { encoding: "base64" });
  const image = { content, file };

  let res;

  try {
    res = await fetch("http://localhost:3000/api/uploadSnapshot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image, projectId, branch }),
    });

    // const json = await body.json();
    if (res.status !== 200) {
      const body = await res.text();
      console.log(res.status, body);
      return body;
    }
    const body = await res.json();
    return body;
  } catch (e) {
    console.error("error", e);
  }
}

(async () => {
  const allFiles = getFiles("./playwright/visuals").slice(0, 10);
  const projectId = "dcb5df26-b418-4fe2-9bdf-5a838e604ec4";
  const branch = "test";

  for (const files of chunk(allFiles, 20)) {
    const res = await Promise.all(
      files.map((file) => uploadImage(file, projectId, branch))
    );

    console.log(
      JSON.stringify(
        res.map((r) => r?.data[0]),
        null,
        2
      )
    );
    console.log("---");

    console.log(
      JSON.stringify(
        res.map((r) => r?.error),
        null,
        2
      )
    );
  }
})();
