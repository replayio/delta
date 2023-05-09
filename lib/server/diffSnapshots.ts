import mergeSnapshots from "../../utils/snapshots";
import { Snapshot } from "../types";
import diffSnapshot from "./diffSnapshot";
import { SnapshotDiff } from "./types";

export default async function diffSnapshots(
  oldSnapshots: Snapshot[],
  newSnapshots: Snapshot[]
): Promise<SnapshotDiff[]> {
  const map = mergeSnapshots(oldSnapshots, newSnapshots);

  const promises: Promise<void>[] = [];
  const diffs: SnapshotDiff[] = [];
  const files = Array.from(map.keys());
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    const value = map.get(file)!;

    promises.push(
      diffSnapshot(value.old, value.new).then((diff) => {
        if (diff !== null) {
          diffs.push(diff);
        }
      })
    );
  }

  await Promise.all(promises);

  return diffs;
}
