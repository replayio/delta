import { diffBase64Images } from "../../lib/diff";
import {
  getSnapshotFromBranch,
  insertSnapshot,
  getProject,
} from "../../lib/supabase";

import { downloadSnapshot, uploadSnapshot } from "../../lib/supabase-storage";

async function diffWithPrimaryBranch(image, projectId) {
  const project = await getProject(projectId);

  const snapshot = await getSnapshotFromBranch(
    image,
    projectId,
    project.data.primary_branch
  );

  if (snapshot.error) {
    return false;
  }

  const primarySnapshot = await downloadSnapshot(snapshot.data.path);
  if (primarySnapshot.error) {
    return false;
  }

  const { changed } = diffBase64Images(image.content, primarySnapshot.data);
  return changed;
}

export default async function handler(req, res) {
  const { image, projectId, branch: branchName } = req.body;

  try {
    const snapshot = await uploadSnapshot(image, projectId);
    const status: string = snapshot.error ? snapshot.error : "Uploaded";
    const primary_changed = await diffWithPrimaryBranch(image, projectId);

    const snapshotResponse = await insertSnapshot(
      branchName,
      projectId,
      image,
      status,
      primary_changed
    );

    res.status(200).json(snapshotResponse);
  } catch (e) {
    console.error("uploadSnapshot error", e);
    res.status(500).json({ error: e });
  }
}
