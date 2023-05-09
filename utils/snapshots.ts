import { Snapshot } from "../lib/types";

export type MergedSnapshotsMap = Map<
  string,
  {
    new: Snapshot | null;
    old: Snapshot | null;
  }
>;

export default function mergeSnapshots(
  oldSnapshots: Snapshot[],
  newSnapshots: Snapshot[]
): MergedSnapshotsMap {
  const map: MergedSnapshotsMap = new Map();

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

  return map;
}
