import { createCache } from "suspense";
import { SnapshotDiff } from "../lib/server/types";
import { ProjectSlug, RunId, Snapshot, SnapshotId } from "../lib/types";
import { ResponseData } from "../pages/api/getMostFrequentlyUpdatedSnapshots";
import {
  getDiffImage,
  getMostFrequentlyUpdatedSnapshots,
  getSnapshotDiffCountForRun,
  getSnapshotDiffsForRun,
  getSnapshotForId,
} from "../utils/ApiClient";

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

// Supabase snapshot record
export const snapshotCache = createCache<[snapshotId: SnapshotId], Snapshot>({
  debugLabel: "snapshot",
  async load([snapshotId]) {
    return await getSnapshotForId({ snapshotId });
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
