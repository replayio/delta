import { diffBase64Images } from "../../lib/diff";
import {
  getSnapshotFromBranch,
  insertSnapshot,
  getProject,
} from "../../lib/supabase";

import { downloadSnapshot, uploadSnapshot } from "../../lib/supabase-storage";

async function diffWithPrimaryBranch(image, projectId) {
  const { project } = await getProject(projectId);

  const { snapshot } = await getSnapshotFromBranch(
    image,
    projectId,
    project.primary_branch
  );

  if (!snapshot) {
    return false;
  }

  const { data: primarySnapshot } = await downloadSnapshot(snapshot.path);
  const { changed } = diffBase64Images(image.content, primarySnapshot);

  return changed;
}

export default async function handler(req, res) {
  const { image, projectId, branch: branchName } = req.body;

  try {
    const { snapshot, error: snapshotError } = await uploadSnapshot(
      image,
      projectId
    );
    const status = snapshot?.path ? "Uploaded" : snapshotError;
    const primary_changed = await diffWithPrimaryBranch(image, projectId);

    const snapshotResponse = await insertSnapshot(
      branchName,
      projectId,
      image,
      status,
      primary_changed
    );

    console.log(snapshotResponse);
    res.status(200).json(snapshotResponse);
  } catch (e) {
    console.error("uploadSnapshot error", e);
    res.status(500).json({ error: e });
  }
}
