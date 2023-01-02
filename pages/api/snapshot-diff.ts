import {
  getProject,
  getSnapshotFromBranch,
} from "../../lib/server/supabase/supabase";
import { downloadSnapshot } from "../../lib/server/supabase/supabase-storage";
import { diffWithPrimaryBranch } from "../../lib/server/supabase/diffWithPrimaryBranch";

export default async function handler(req, res) {
  const { projectId, file, branch } = req.query;

  console.log(`snapshot-diff`, `${projectId}, ${file}, ${branch}`);

  const snapshot = await getSnapshotFromBranch(file, projectId, branch);

  if (snapshot.data.primary_diff_path) {
    const image = await downloadSnapshot(snapshot.data.primary_diff_path);
    return res
      .setHeader("Content-Type", "image/png")
      .status(200)
      .send(image.data);
  }

  const imageRes = await downloadSnapshot(snapshot.data.path);
  const image = {
    file,
    content: imageRes.data,
  };
  const diff = await diffWithPrimaryBranch(projectId, branch, image);

  if (diff.error) {
    return res.status(500).json({ error: diff.error });
  }

  return res.setHeader("Content-Type", "image/png").status(200).send(diff.png);
}
