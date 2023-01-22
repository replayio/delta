import { diffBase64Images } from "./diff";
import { getProject } from "./supabase/supabase";
import { getSnapshotFromBranch } from "./supabase/snapshots";

import {
  downloadSnapshot,
  StoredSnapshot,
  uploadSnapshot,
} from "./supabase/storage";
import { PNGWithMetadata } from "pngjs";

type Image = {
  content: string;
  file: string;
};

type Diff = {
  changed: boolean;
  diffSnapshot: StoredSnapshot | null;
  error: string | null;
  numPixels: number | null;
  png: Buffer | null;
};

function createErrorDiff(errorMessage: string): Diff {
  console.error(errorMessage);

  return {
    changed: false,
    diffSnapshot: null,
    error: errorMessage,
    numPixels: null,
    png: null,
  };
}

export async function diffWithPrimaryBranch(
  projectId: string,
  branchName: string,
  image: Image
): Promise<Diff> {
  const { data: project } = await getProject(projectId);
  if (project == null) {
    return createErrorDiff(`Could not find project with id "${projectId}"`);
  } else if (branchName === project.primary_branch) {
    return createErrorDiff(
      `Cannot diff primary branch "${branchName}" with itself`
    );
  }

  const { data: primarySnapshotData, error: primarySnapshotError } =
    await getSnapshotFromBranch(image.file, projectId, project.primary_branch);
  if (primarySnapshotError) {
    return createErrorDiff(primarySnapshotError.message);
  }

  const primaryImage = await downloadSnapshot(primarySnapshotData.path);
  if (primaryImage.error) {
    return createErrorDiff(primaryImage.error.message);
  }

  const { changed, png, numPixels, error } = await diffBase64Images(
    image.content,
    primaryImage.data
  );
  if (error) {
    return createErrorDiff(error.message);
  } else if (png == null) {
    return createErrorDiff("No diff data could be generated");
  }

  const diffSnapshot = await uploadSnapshot(png, projectId);
  return {
    changed,
    diffSnapshot: diffSnapshot.data,
    png,
    error: null,
    numPixels,
  };
}
