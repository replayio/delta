const fs = require("fs");
const fetch = require("node-fetch");

async function downloadImage(path) {
  let res;

  try {
    res = await fetch(
      encodeURI(`http://localhost:3000/api/downloadSnapshot?path=${path}`)
    );

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
  const path =
    "dcb5df26-b418-4fe2-9bdf-5a838e604ec4/555c9968-4ad1-4601-806a-0bde6522e55b/test/fixtures/console.ts-snapshots/dark/filtered-no-results-linux.png";
  const res = await downloadImage(path);
  console.log(res);
})();
