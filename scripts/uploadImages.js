const fs = require("fs");
const fetch = require("node-fetch");

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

async function uploadImage(file, actionId) {
  const content = fs.readFileSync(file, { encoding: "base64" });
  const image = { content, file };

  let res;

  try {
    res = await fetch("http://localhost:3000/api/uploadSnapshot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image, actionId }),
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
  files = getFiles("./test/fixtures/");
  // const actionId = "701d18b8-6f38-4d2e-9159-312e0be2190e";
  const actionId = "c2ebfb45-f642-432c-934f-26c8ce3da209";
  // const actionId = "555c9968-4ad1-4601-806a-0bde6522e55b";
  for (const file of files.slice(0, 1)) {
    const res = await uploadImage(file, actionId);
    console.log(res);
  }
})();
