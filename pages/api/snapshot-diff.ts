import { getProject, getSnapshotFromBranch } from "../../lib/supabase";
import { downloadSnapshot } from "../../lib/supabase-storage";
import { diffBase64Images } from "../../lib/diff";

export default async function handler(req, res) {
  const { projectId, file, branch } = req.query;

  const project = await getProject(projectId);

  const snapshot = await getSnapshotFromBranch(file, projectId, branch);

  const primarySnapshot = await getSnapshotFromBranch(
    file,
    projectId,
    project.data.primary_branch
  );

  if (!snapshot || !primarySnapshot) {
    return res.status(404).send("Not found");
  }

  const image = await downloadSnapshot(snapshot.data.path);
  const primaryImage = await downloadSnapshot(primarySnapshot.data.path);

  if (!image || !primaryImage) {
    return res.status(404).send("Not found");
  }

  const diff = diffBase64Images(image.data, primaryImage.data, file);

  if (diff.error) {
    return res.status(500).json(diff.error);
  }

  const { diffPng, changed, numDiffPixels } = diff;
  if (numDiffPixels > 0) {
    console.log(">> diffing", { changed, numDiffPixels });
  }

  return res.setHeader("Content-Type", "image/png").status(200).send(diffPng);
}
