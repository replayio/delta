import { getSnapshotsFromBranch } from "../../lib/supabase";

export default async function handler(req, res) {
  const { branch, project_id } = req.query;

  if (!branch || !project_id) {
    return res.status(500).json({ error: "missing branch or project_id" });
  }

  const snapshots = await getSnapshotsFromBranch(project_id, branch);

  if (snapshots.error) {
    res.status(500).json({ error: snapshots.error });
  }

  res.status(200).json(snapshots.data);
}
