import { insertSnapshot } from "../../lib/server/supabase/snapshots";

import { uploadSnapshot } from "../../lib/server/supabase/supabase-storage";
import { diffWithPrimaryBranch } from "../../lib/server/supabase/diffWithPrimaryBranch";

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

    const snapshot = await uploadSnapshot(image.content, projectId);
    console.log("uploadSnapshot (2) ", branchName, image.file);

    const status: string = snapshot.error ? snapshot.error : "Uploaded";
    console.log("uploadSnapshot (3) ", branchName, image.file, status);

    const primaryDiff = await diffWithPrimaryBranch(
      projectId,
      branchName,
      image
    );

    console.log("uploadSnapshot (4) ", branchName, image.file);

    const snapshotResponse = await insertSnapshot({
      branchName,
      projectId,
      image,
      status,
      primary_changed: primaryDiff.changed,
      primary_diff_path: primaryDiff.diffSnapshot?.path,
      primary_num_pixels: primaryDiff.diffSnapshot?.numPixels,
    });

    console.log(
      "uploadSnapshot (5) ",
      branchName,
      image.file,
      snapshotResponse.data || snapshot.error
    );

    console.log("uploadSnapshot finished ", branchName, image.file);
    res.status(200).json(snapshotResponse);
  } catch (e) {
    console.error("uploadSnapshot error", e);
    res.status(500).json({ error: e.message, file: image.file });
  }
}
