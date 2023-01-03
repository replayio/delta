import {
  insertSnapshot,
  updateSnapshot,
} from "../../lib/server/supabase/snapshots";

import { uploadSnapshot } from "../../lib/server/supabase/storage";
import { diffWithPrimaryBranch } from "../../lib/server/diffWithPrimaryBranch";
import { incrementActionNumSnapshotsChanged } from "../../lib/server/supabase/incrementActionNumSnapshotsChanged";

export default async function handler(req, res) {
  const { image, projectId, branch: branchName, runId } = req.body;
  console.log("uploadSnapshot start (1)", branchName, runId, image.file);
  try {
    if (!branchName) {
      return res.status(400).json({ error: "branchName is required" });
    }

    if (!projectId) {
      return res.status(400).json({ error: "projectId is required" });
    }

    if (!image.file || !image.content) {
      return res.status(400).json({ error: "image is required" });
    }

    console.log("uploadSnapshot (2) -  upload", branchName, image.file);
    const snapshot = await uploadSnapshot(image.content, projectId);
    const status: string = snapshot.error ? snapshot.error : "Uploaded";

    console.log("uploadSnapshot (3) - insert", status, snapshot.data);

    const snapshotResponse = await insertSnapshot(
      branchName,
      projectId,
      image,
      status
    );

    console.log(
      "uploadSnapshot (4) - diff",
      snapshotResponse.data || snapshot.error
    );

    const primaryDiff = await diffWithPrimaryBranch(
      projectId,
      branchName,
      image
    );

    console.log("uploadSnapshot (5) - update", {
      primary_changed: primaryDiff.changed,
      primary_diff_path: primaryDiff.diffSnapshot?.path,
      primary_num_pixels: primaryDiff.diffSnapshot?.numPixels,
    });

    const updatedSnapshot = await updateSnapshot(snapshotResponse.data.id, {
      primary_changed: primaryDiff.changed,
      primary_diff_path: primaryDiff.diffSnapshot?.path,
      primary_num_pixels: primaryDiff.diffSnapshot?.numPixels,
    });

    if (primaryDiff.changed) {
      console.log("uploadSnapshot (6) - incrementActionNumSnapshotsChanged");
      await incrementActionNumSnapshotsChanged(projectId, branchName);
    }

    console.log("uploadSnapshot finished ", updatedSnapshot.data);
    res.status(200).json(updatedSnapshot);
  } catch (e) {
    console.error("uploadSnapshot error", e);
    res.status(500).json({ error: e.message, file: image.file });
  }
}
