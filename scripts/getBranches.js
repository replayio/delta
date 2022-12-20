const fs = require("fs");
const fetch = require("node-fetch");

async function getBranches(projectId) {
  let res;

  try {
    res = await fetch(
      encodeURI(`http://localhost:3000/api/getActions?projectId=${projectId}`)
    );

    // const json = await body.json();
    if (res.status !== 200) {
      const body = await res.text();
      console.log(":poop:", res.status, body);
      return body;
    }
    const body = await res.json();
    return body;
  } catch (e) {
    console.error("error", e);
  }
}

(async () => {
  const projectId = "dcb5df26-b418-4fe2-9bdf-5a838e604ec4";
  const res = await getBranches(projectId);
  console.log(res);
})();
