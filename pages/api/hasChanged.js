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

export default async function handler(req, res) {
  const { branch, primaryBranch } = req.query;

  const branchSnapshots = await get(
    encodeURI(`/api/getSnapshotsForBranch/?branch=${branch}`)
  );

  const primaryBranchSnapshots = await get(
    encodeURI(`/api/getSnapshotsForBranch/?branch=${primaryBranch}`)
  );

  console.log("hello-event", primaryBranch);
  res.status(200).json({ branchSnapshots, primaryBranchSnapshots });
}
