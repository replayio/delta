import { useEffect } from "react";
import {
  fetchSnapshotAsync,
  SnapshotFile,
  SnapshotVariant,
} from "../../suspense/SnapshotCache";

// Naive implementation for pre-fetching snapshot data.
// This hook pre-fetches the previous and next snapshot, based on the current index.
// Suspense cache pre-fetching is fire-and-forget, so it's okay if the view loads before prefetch has completed.
export default function useSnapshotPrefetchedData(
  snapshotFiles: SnapshotFile[],
  currentIndex: number
): void {
  useEffect(() => {
    for (let index = currentIndex - 1; index <= currentIndex + 1; index++) {
      if (index >= 0 && index < snapshotFiles.length) {
        const snapshotFile = snapshotFiles[index];
        prefetchSnapshotFile(snapshotFile);
      }
    }
  }, [snapshotFiles, currentIndex]);
}

function prefetchSnapshotFile(snapshotFile: SnapshotFile) {
  const { dark, light } = snapshotFile.variants;
  if (dark) {
    prefetchSnapshotVariant(dark);
  }
  if (light) {
    prefetchSnapshotVariant(light);
  }
}

function prefetchSnapshotVariant(snapshotVariant: SnapshotVariant) {
  fetchSnapshotAsync(snapshotVariant.pathBranchData);
  fetchSnapshotAsync(snapshotVariant.pathDiffData);
  fetchSnapshotAsync(snapshotVariant.pathMainData);
}
