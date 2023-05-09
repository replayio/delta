import { createCache } from "suspense";
import { SnapshotDiff } from "../lib/server/types";
import { ProjectSlug, RunId } from "../lib/types";
import { ResponseData } from "../pages/api/getMostFrequentlyUpdatedSnapshots";
import {
  downloadSnapshot,
  getDiffImage,
  getMostFrequentlyUpdatedSnapshots,
  getSnapshotDiffCountForRun,
  getSnapshotDiffsForRun,
} from "../utils/ApiClient";
import { Base64Image, base64ImageCache } from "./ImageCache";

export type SnapshotTheme = "dark" | "light";

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
  string | null
>({
  debugLabel: "imageDiffCache",
  getKey([pathA, pathB]) {
    return JSON.stringify({ pathA, pathB });
  },
  async load([pathA, pathB]) {
    return getDiffImage({ pathA, pathB });
  },
});

// Fetch base64 encoded snapshot image (with dimensions)
export const snapshotCache = createCache<[path: string], Base64Image>({
  debugLabel: "snapshot",
  async load([path]) {
    const base64String = await downloadSnapshot({ path });
    return await base64ImageCache.readAsync(base64String);
  },
});

// Fetch count of changed snapshots (new, deleted, or changed) for a run
export const snapshotDiffCountForRunCache = createCache<[runId: RunId], number>(
  {
    debugLabel: "snapshotDiffCountForRunCache",
    getKey([runId]) {
      return runId;
    },
    async load([runId]) {
      return await getSnapshotDiffCountForRun({ runId });
    },
  }
);

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
