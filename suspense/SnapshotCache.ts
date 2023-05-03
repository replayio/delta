import { createCache } from "suspense";
import { diffBase64Images } from "../lib/server/diff";
import { SnapshotDiff } from "../lib/server/types";
import { ProjectSlug, RunId } from "../lib/types";
import { ResponseData } from "../pages/api/getMostFrequentlyUpdatedSnapshots";
import {
  downloadSnapshot,
  getMostFrequentlyUpdatedSnapshots,
  getSnapshotDiffsForRun,
} from "../utils/ApiClient";

export type SnapshotTheme = "dark" | "light";

export type Base64Image = {
  base64String: string;
  height: number;
  width: number;
};

// Fetch list of snapshots for a branch
export const frequentlyUpdatedSnapshotsCache = createCache<
  [projectSlug: ProjectSlug, afterDate: string],
  ResponseData
>({
  debugLabel: "frequentlyUpdatedSnapshots",
  getKey([projectSlug, afterDate]) {
    return JSON.stringify({ afterDate, projectSlug });
  },
  async load([projectSlug, afterDate]) {
    return await getMostFrequentlyUpdatedSnapshots({
      afterDate,
      projectSlug,
    });
  },
});

// Compute diff between two images (as a base64 encoded image)
export const imageDiffCache = createCache<
  [pathA: string, pathB: string],
  Base64Image | null
>({
  debugLabel: "imageDiffCache",
  getKey([pathA, pathB]) {
    return JSON.stringify({ pathA, pathB });
  },
  async load([pathA, pathB]) {
    const imageA = snapshotCache.read(pathA);
    const imageB = snapshotCache.read(pathB);
    const diff = await diffBase64Images(
      imageA.base64String,
      imageB.base64String
    );
    if (!diff.png) {
      return null;
    }

    return createSnapshotImage(diff.png.toString());
  },
});

// Fetch base64 encoded snapshot image (with dimensions)
export const snapshotCache = createCache<[path: string], Base64Image>({
  debugLabel: "snapshot",
  async load([path]) {
    const base64String = await downloadSnapshot({ path });
    return await createSnapshotImage(base64String);
  },
});

// Fetch list of snapshot diffs (new, deleted, or changed) for a run
export const snapshotDiffForRunCache = createCache<
  [runId: RunId],
  SnapshotDiff[]
>({
  debugLabel: "snapshotDiffForRunCache",
  getKey([runId]) {
    return runId;
  },
  async load([runId]) {
    return await getSnapshotDiffsForRun({ runId });
  },
});

async function createSnapshotImage(base64String: string): Promise<Base64Image> {
  return new Promise<Base64Image>((resolve, reject) => {
    try {
      const image = new Image();
      image.addEventListener("error", (event) => {
        reject(event.error);
      });
      image.addEventListener("load", () => {
        resolve({
          base64String,
          height: image.naturalHeight,
          width: image.naturalWidth,
        });
      });
      image.src = `data:image/png;base64,${base64String}`;
    } catch (error) {
      reject(error);
    }
  });
}
