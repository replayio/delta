import mergeSnapshots from "../../utils/snapshots";
import { Snapshot } from "../types";

export default function getSnapshotDiffCount(
  oldSnapshots: Snapshot[],
  newSnapshots: Snapshot[]
): number {
  let count = 0;

  const map = mergeSnapshots(oldSnapshots, newSnapshots);
  map.forEach((value) => {
    const { new: newSnapshot, old: oldSnapshot } = value;
    if (oldSnapshot && newSnapshot) {
      if (oldSnapshot.delta_path !== newSnapshot.delta_path) {
        count++;
      }
    } else if (oldSnapshot != null) {
      count++;
    } else if (newSnapshot != null) {
      count++;
    } else {
      // Unexpected
    }
  });

  return count;
}
