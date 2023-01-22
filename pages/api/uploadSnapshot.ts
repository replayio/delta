import {
  getSnapshotFromBranch,
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
    const uploadedSnapshot = await uploadSnapshot(image.content, projectId);

    console.log("uploadSnapshot (3) - insert", uploadedSnapshot.data);

    const snapshotResponse = await insertSnapshot(
      branchName,
      projectId,
      image,
      runId
    );

    let snapshot = snapshotResponse.data;
    console.log(
      "uploadSnapshot (4) - diff",
      snapshotResponse.data,
      uploadedSnapshot.error
    );

    if (!snapshot) {
      console.log(
        `uploadSnapshot (5) - could not insert snapshot, so try to get the last saved snapshot from branch ${branchName}`,
        uploadedSnapshot.error
      );

      const previousSnapshot = await getSnapshotFromBranch(
        image.file,
        projectId,
        branchName
      );

      console.log(
        "uploadSnapshot (6) - getSnapshotFromBranch",
        previousSnapshot.data
      );
      if (previousSnapshot.data) {
        snapshot = previousSnapshot.data;
      } else {
        console.log(
          `uploadSnapshot (6) - could not get snapshot from branch ${branchName}`,
          previousSnapshot.error
        );
        return res.status(500).json({ error: "Could not find snapshot" });
      }
    }

    const primaryDiff = await diffWithPrimaryBranch(
      projectId,
      branchName,
      image
    );

    console.log("uploadSnapshot (7) - update", {
      primary_changed: primaryDiff.changed,
      primary_diff_path: primaryDiff.diffSnapshot?.path,
      primary_num_pixels: primaryDiff.numPixels,
    });

    const updatedSnapshot = await updateSnapshot(snapshot.id, {
      primary_changed: primaryDiff.changed,
      primary_diff_path: primaryDiff.diffSnapshot?.path,
      primary_num_pixels: primaryDiff.numPixels,
    });

    if (primaryDiff.changed) {
      console.log("uploadSnapshot (8) - incrementActionNumSnapshotsChanged");
      await incrementActionNumSnapshotsChanged(projectId, branchName);
    }

    console.log("uploadSnapshot finished ", updatedSnapshot.data);
    res.status(200).json(updatedSnapshot);
  } catch (e) {
    console.error("uploadSnapshot error", e);
    res.status(500).json({ error: e.message, file: image.file });
  }
}
