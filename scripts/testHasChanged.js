const fetch = require("node-fetch");
const dotenv = require("dotenv");

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
    encodeURI(`/api/hasChanged?branch=main&primaryBranch=main-2`)
  );

  console.log("hello-event", hasChanged.primaryBranchSnapshots);
})();
