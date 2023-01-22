import { getSnapshotFromBranch } from "../../lib/server/supabase/snapshots";
import { downloadSnapshot } from "../../lib/server/supabase/storage";
import { diffWithPrimaryBranch } from "../../lib/server/diffWithPrimaryBranch";
import { updateSnapshot } from "../../lib/server/supabase/snapshots";

export default async function handler(req, res) {
  const { projectId, file, branch } = req.query;

  console.log(`snapshot-diff (1)`, `${projectId}, ${file}, ${branch}`);

  const { data: snapshotData, error: snapshotError } =
    await getSnapshotFromBranch(file, projectId, branch);
  if (snapshotData == null || snapshotError) {
    return res.status(500).json({
      error:
        snapshotError ||
        Error(`Could not load snapshot for branch "${branch}"`),
    });
  }

  if (snapshotData.primary_diff_path) {
    console.log(
      `snapshot-diff (2) diff exists`,
      snapshotData.primary_diff_path
    );
    const image = await downloadSnapshot(snapshotData.primary_diff_path);
    return res
      .setHeader("Content-Type", "image/png")
      .status(200)
      .send(image.data);
  }

  console.log(`snapshot-diff (2) diff does not exist`, snapshotData.file);
  const imageRes = await downloadSnapshot(snapshotData.path);
  const image = {
    file,
    content: imageRes.data || "",
  };
  const diff = await diffWithPrimaryBranch(projectId, branch, image);
  if (diff.error || !diff.png) {
    return res
      .status(500)
      .json({ error: diff.error || Error("Could not load diff PNG") });
  }

  console.log(
    `snapshot-diff (3) updating snapshot`,
    diff.diffSnapshot?.path,
    diff.numPixels
  );

  // Save the primary_diff_path to the snapshot if it exists
  if (diff.diffSnapshot?.path) {
    const updatedSnapshot = await updateSnapshot(snapshotData.id, {
      primary_diff_path: diff.diffSnapshot.path,
      primary_num_pixels: diff.numPixels,
      primary_changed: diff.changed,
    });

    if (updatedSnapshot.error) {
      console.log(
        `snapshot-diff (3) failed to update snapshot`,
        updatedSnapshot.error
      );
    }
  }
  console.log(`snapshot-diff (finished)`, file);
  return res.setHeader("Content-Type", "image/png").status(200).send(diff.png);
}
