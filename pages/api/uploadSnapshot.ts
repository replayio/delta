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
  console.log("uploadSnapshot start (1)", branchName, image.file);
  try {
    const snapshot = await uploadSnapshot(image, projectId);
    console.log("uploadSnapshot (2) ", branchName, image.file);
    const status: string = snapshot.error ? snapshot.error : "Uploaded";
    console.log("uploadSnapshot (3) ", branchName, image.file, status);

    const primary_changed = await diffWithPrimaryBranch(image, projectId);
    console.log("uploadSnapshot (4) ", branchName, image.file);

    const snapshotResponse = await insertSnapshot(
      branchName,
      projectId,
      image,
      status,
      primary_changed
    );

    console.log(
      "uploadSnapshot (5) ",
      branchName,
      image.file,
      snapshotResponse
    );

    console.log("uploadSnapshot finished ", branchName, image.file);
    res.status(200).json(snapshotResponse);
  } catch (e) {
    console.error("uploadSnapshot error", e);
    res.status(500).json({ error: e });
  }
}
