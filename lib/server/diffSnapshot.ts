import { Snapshot } from "../types";
import { diffBase64Images } from "./diff";
import { downloadSnapshot } from "./supabase/storage/Snapshots";
import { SnapshotDiff } from "./types";

export default async function diffSnapshot(
  oldSnapshot: Snapshot | null,
  newSnapshot: Snapshot | null
): Promise<SnapshotDiff | null> {
  if (oldSnapshot && newSnapshot) {
    if (oldSnapshot.delta_path === newSnapshot.delta_path) {
      return null;
    } else {
      const oldImage = await downloadSnapshot(oldSnapshot.delta_path);
      const newImage = await downloadSnapshot(newSnapshot.delta_path);
      const { changed } = await diffBase64Images(oldImage, newImage);
      if (changed) {
        return {
          file: oldSnapshot.delta_file,
          newPath: newSnapshot.delta_path,
          oldPath: oldSnapshot.delta_path,
          type: "changed",
        };
      } else {
        return null;
      }
    }
  } else if (oldSnapshot != null) {
    return {
      file: oldSnapshot.delta_file,
      oldPath: oldSnapshot.delta_path,
      type: "removed",
    };
  } else if (newSnapshot != null) {
    return {
      file: newSnapshot.delta_file,
      newPath: newSnapshot.delta_path,
      type: "added",
    };
  } else {
    throw Error(`Both old and new snapshots are null`);
  }
}
