import { Snapshot } from "../types";
import diffSnapshot from "./diffSnapshot";
import { SnapshotDiff } from "./types";

export default async function diffSnapshots(
  oldSnapshots: Snapshot[],
  newSnapshots: Snapshot[]
): Promise<SnapshotDiff[]> {
  const map = new Map<
    string,
    {
      new: Snapshot | null;
      old: Snapshot | null;
    }
  >();

  oldSnapshots.forEach((snapshot) => {
    map.set(snapshot.delta_file, {
      new: null,
      old: snapshot,
    });
  });

  newSnapshots.forEach((snapshot) => {
    const value = map.get(snapshot.delta_file);
    if (value) {
      value.new = snapshot;
    } else {
      map.set(snapshot.delta_file, {
        new: snapshot,
        old: null,
      });
    }
  });

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
