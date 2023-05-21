import { useEffect } from "react";
import { imageDiffCache } from "../../suspense/SnapshotCache";
import { snapshotImageCache } from "../../suspense/SnapshotVariantCache";
import {
  SnapshotDiff,
  isSnapshotVariantDiffAdded,
  isSnapshotVariantDiffRemoved,
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
  for (let variant in snapshotDiff.snapshotVariantDiffs) {
    const snapshotVariantDiff = snapshotDiff.snapshotVariantDiffs[variant];
    if (isSnapshotVariantDiffAdded(snapshotVariantDiff)) {
      prefetchSnapshot(snapshotVariantDiff.newPath);
    } else if (isSnapshotVariantDiffRemoved(snapshotVariantDiff)) {
      prefetchSnapshot(snapshotVariantDiff.oldPath);
    } else {
      prefetchSnapshot(snapshotVariantDiff.newPath);
      prefetchSnapshot(snapshotVariantDiff.oldPath);
      imageDiffCache.prefetch(
        snapshotVariantDiff.oldPath,
        snapshotVariantDiff.newPath
      );
    }
  }
}

function prefetchSnapshot(path: string | null) {
  if (path !== null) {
    snapshotImageCache.prefetch(path);
  }
}
