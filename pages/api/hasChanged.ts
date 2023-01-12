import fetch from "node-fetch";
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

  const branchSnapshots = (await get(
    encodeURI(`/api/getSnapshotsForBranch/?branch=${branch}`)
  )) as any;

  const primaryBranchSnapshots = (await get(
    encodeURI(`/api/getSnapshotsForBranch/?branch=${primaryBranch}`)
  )) as any;

  const snapshots = branchSnapshots.snapshots
    .map((snapshot) => {
      const mainSnapshot = primaryBranchSnapshots.snapshots.find(
        (mainSnapshot) => mainSnapshot.file === snapshot.file
      );

      return {
        ...snapshot,
        sameSha:
          mainSnapshot && snapshot.sha === mainSnapshot.sha ? true : false,
        mainSnapshot,
      };
    })
    .filter((snapshot) => !snapshot.sameSha);

  console.log("hello-event", primaryBranch);
  res.status(200).json({ snapshots, branchSnapshots, primaryBranchSnapshots });
}
