import { Snapshot } from "../lib/server/supabase/supabase";

export function changedSnapshots(snapshots: Snapshot[]): Snapshot[] {
  return snapshots.filter((snapshot) => snapshot.primary_changed);
}
