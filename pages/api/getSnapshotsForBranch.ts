import { getSnapshotsFromBranch } from "../../lib/server/supabase/snapshots";

export default async function handler(req, res) {
  const { branch, project_id } = req.query;

  if (!branch || !project_id) {
    return res.status(500).json({ error: "missing branch or project_id" });
  }

  console.log(`getSnapshotsForBranch (1) - ${branch}, ${project_id}`);
  const snapshots = await getSnapshotsFromBranch(project_id, branch);

  if (snapshots.error) {
    console.log(
      `getSnapshotsForBranch (2) - Error getting snapshots for ${branch} in ${project_id}`
    );
    res.status(500).json({ error: snapshots.error });
  }

  console.log(
    `getSnapshotsForBranch (finished) - Found ${
      snapshots.data?.length ?? 0
    } snapshots for ${branch} in ${project_id}`
  );
  res.status(200).json(snapshots.data);
}
