import { useEffect } from "react";
import { imageDiffCache, snapshotCache } from "../../suspense/SnapshotCache";
import {
  SnapshotDiff,
  isSnapshotDiffAdded,
  isSnapshotDiffRemoved,
} from "../server/types";

// Naive implementation for pre-fetching snapshot data.
// This hook pre-fetches the previous and next snapshot, based on the current index.
// Suspense cache pre-fetching is fire-and-forget, so it's okay if the view loads before prefetch has completed.
export default function useSnapshotPrefetchedData(
  snapshotDiffs: SnapshotDiff[],
  currentIndex: number
): void {
  useEffect(() => {
    for (let index = currentIndex - 1; index <= currentIndex + 1; index++) {
      if (index >= 0 && index < snapshotDiffs.length) {
        const snapshotDiff = snapshotDiffs[index];
        prefetchSnapshotFile(snapshotDiff);
      }
    }
  }, [snapshotDiffs, currentIndex]);
}

function prefetchSnapshotFile(snapshotDiff: SnapshotDiff) {
  if (isSnapshotDiffAdded(snapshotDiff)) {
    prefetchSnapshot(snapshotDiff.newPath);
  } else if (isSnapshotDiffRemoved(snapshotDiff)) {
    prefetchSnapshot(snapshotDiff.oldPath);
  } else {
    prefetchSnapshot(snapshotDiff.newPath);
    prefetchSnapshot(snapshotDiff.oldPath);
    imageDiffCache.prefetch(snapshotDiff.oldPath, snapshotDiff.newPath);
  }
}

function prefetchSnapshot(path: string | null) {
  if (path !== null) {
    snapshotCache.prefetch(path);
  }
}
