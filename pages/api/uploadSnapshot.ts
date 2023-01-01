import { diffBase64Images } from "../../lib/diff";
import {
  getSnapshotFromBranch,
  insertSnapshot,
  getProject,
} from "../../lib/supabase";

import { downloadSnapshot, uploadSnapshot } from "../../lib/supabase-storage";

async function diffWithPrimaryBranch(image, branchName, projectId) {
  console.log("diffWithPrimaryBranch (1)", projectId);
  const project = await getProject(projectId);

  if (branchName === project.data.primary_branch) {
    console.log(
      `diffWithPrimaryBranch (2) bailing because ${branchName} is the primary branch`
    );
    return false;
  }

  console.log("diffWithPrimaryBranch (2)", projectId);
  const snapshot = await getSnapshotFromBranch(
    image.file,
    projectId,
    project.data.primary_branch
  );

  if (snapshot.error) {
    console.log("diffWithPrimaryBranch (3) bailing with error", snapshot.error);
    return false;
  }

  console.log("diffWithPrimaryBranch (3)", snapshot.data.path);
  const primarySnapshot = await downloadSnapshot(snapshot.data.path);
  if (primarySnapshot.error) {
    console.log(
      "diffWithPrimaryBranch (4) bailing with error",
      primarySnapshot.error
    );
    return false;
  }

  const { changed } = diffBase64Images(image.content, primarySnapshot.data);
  return changed;
}

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

    const snapshot = await uploadSnapshot(image, projectId);
    console.log("uploadSnapshot (2) ", branchName, image.file);

    const status: string = snapshot.error ? snapshot.error : "Uploaded";
    console.log("uploadSnapshot (3) ", branchName, image.file, status);

    const primary_changed = await diffWithPrimaryBranch(
      image,
      branchName,
      projectId
    );

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
      snapshotResponse.data || snapshot.error
    );

    console.log("uploadSnapshot finished ", branchName, image.file);
    res.status(200).json(snapshotResponse);
  } catch (e) {
    console.error("uploadSnapshot error", e);
    res.status(500).json({ error: e });
  }
}
