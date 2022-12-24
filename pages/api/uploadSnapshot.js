const { createHash } = require("crypto");
import { diffBase64Images } from "../../lib/diff";
import {
  getSnapshotFromBranch,
  insertSnapshot,
  getProjectIdFromActionId,
} from "../../lib/supabase";

import { downloadSnapshot, uploadSnapshot } from "../../lib/supabase-storage";

async function diffWithPrimaryBranch(image, projectId) {
  const project = await getProject(projectId);
  const primaryImage = await getSnapshotFromBranch(
    image,
    projectId,
    project.primary_branch
  );

  const { data: primarySnapshot } = await downloadSnapshot(primaryImage.path);
  const { changed } = diffBase64Images(image.content, primarySnapshot);

  return changed;
}

export default async function handler(req, res) {
  const { image, actionId } = req.body;

  try {
    console.log("actionId", actionId);

    const projectId = await getProjectIdFromActionId(actionId);
    const sha = createHash("sha256").update(image.content).digest("hex");
    const uploadResponse = await uploadSnapshot(image, projectId, sha);
    const status = uploadResponse.data?.path
      ? "Uploaded"
      : uploadResponse.error?.error;

    const primary_changed = await diffWithPrimaryBranch();

    const snapshotResponse = await insertSnapshot(
      sha,
      actionId,
      projectId,
      image,
      status,
      primary_changed
    );

    console.log(snapshotResponse);

    res.status(200).json(snapshotResponse);
  } catch (e) {
    console.error("erro", e);
    res.status(500).json({ error: e });
  }
}
