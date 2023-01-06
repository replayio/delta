import { diffBase64Images } from "./diff";
import { getProject } from "./supabase/supabase";
import { getSnapshotFromBranch } from "./supabase/snapshots";

import { downloadSnapshot, uploadSnapshot } from "./supabase/storage";

type Image = {
  content: string;
  file: string;
};

export async function diffWithPrimaryBranch(
  projectId: string,
  branchName: string,
  image: Image
) {
  console.log("diffWithPrimaryBranch (1)", projectId, branchName, image.file);
  const project = await getProject(projectId);

  if (branchName === project.data.primary_branch) {
    console.log(
      `diffWithPrimaryBranch (2) bailing because ${branchName} is the primary branch`
    );
    return { changed: false, diffSnapshot: null, error: "primary branch" };
  }

  console.log("diffWithPrimaryBranch (2) getSnapshotFromBranch", projectId);
  const primarySnapshot = await getSnapshotFromBranch(
    image.file,
    projectId,
    project.data.primary_branch
  );

  if (primarySnapshot.error) {
    if (primarySnapshot.error.code == "PGRST116") {
      console.log(
        `diffWithPrimaryBranch (3) bailing because ${image.file} does not exist in the primary branch`
      );
      return {
        changed: false,
        diffSnapshot: null,
        error: primarySnapshot.error,
      };
    }

    console.log(
      "diffWithPrimaryBranch (3) bailing with error",
      primarySnapshot.error
    );
    return { changed: false, diffSnapshot: null, error: primarySnapshot.error };
  }

  console.log(
    "diffWithPrimaryBranch (3) downloadSnapshot",
    primarySnapshot.data.path
  );

  const primaryImage = await downloadSnapshot(primarySnapshot.data.path);
  if (primaryImage.error) {
    console.log(
      "diffWithPrimaryBranch (4) bailing with error",
      primaryImage.error
    );
    return { changed: false, diffSnapshot: null, error: primaryImage.error };
  }

  console.log(
    "diffWithPrimaryBranch (4) diffBase64Images",
    primaryImage.data.slice(0, 100),
    image.content.slice(0, 100)
  );
  const { changed, png, numPixels, error } = await diffBase64Images(
    image.content,
    primaryImage.data
  );

  if (error || !png) {
    console.log(
      "diffWithPrimaryBranch (5) bailing with error or no png",
      error,
      png
    );
    return { changed, diffSnapshot: null, error, numPixels, png };
  }

  console.log("diffWithPrimaryBranch (6) uploadSnapshot", {
    changed,
    numPixels,
  });
  const diffSnapshot = await uploadSnapshot(png, projectId);

  console.log("diffWithPrimaryBranch (7) finished", diffSnapshot);
  return {
    changed,
    diffSnapshot: diffSnapshot.data,
    png,
    error: null,
    numPixels,
  };
}