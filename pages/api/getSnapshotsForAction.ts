import { getAction } from "../../lib/server/supabase/actions";
import { getSnapshotFromAction } from "../../lib/server/supabase/snapshots";

export default async function handler(req, res) {
  const { action: actionId, project_id } = req.query;

  if (!actionId || !project_id) {
    return res.status(500).json({ error: "missing action or project_id" });
  }

  console.log(`getSnapshotsForAction (1) - ${actionId}, ${project_id}`);
  const action = await getAction(actionId);

  const snapshots = await getSnapshotFromAction(action.data);

  if (snapshots.error) {
    console.log(
      `getSnapshotsForAction (2) - Error getting snapshots for ${actionId} in ${project_id}`
    );
    res.status(500).json({ error: snapshots.error });
  }

  res.status(200).json(snapshots.data);
}
