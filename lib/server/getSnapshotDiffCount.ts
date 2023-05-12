import mergeSnapshots from "../../utils/snapshots";
import { Snapshot } from "../types";
import diffSnapshot from "./diffSnapshot";

export default async function getSnapshotDiffCount(
  oldSnapshots: Snapshot[],
  newSnapshots: Snapshot[]
): Promise<number> {
  let count = 0;

  const promises: Promise<void>[] = [];

  const map = mergeSnapshots(oldSnapshots, newSnapshots);
  const values = Array.from(map.values());
  for (let index = 0; index < values.length; index++) {
    const { new: newSnapshot, old: oldSnapshot } = values[index];
    if (oldSnapshot && newSnapshot) {
      if (oldSnapshot.delta_path !== newSnapshot.delta_path) {
        // Different shas might still have the same image content
        // but we can at least avoid downloading and diffing most images this way
        promises.push(
          diffSnapshot(oldSnapshot, newSnapshot).then((diff) => {
            if (diff !== null) {
              count++;
            }
          })
        );
      }
    } else if (oldSnapshot != null) {
      count++;
    } else if (newSnapshot != null) {
      count++;
    } else {
      // Unexpected
    }
  }

  await Promise.all(promises);

  return count;
}
