import { RunId, Snapshot, SnapshotId, SnapshotVariant } from "../../../types";
import { supabase } from "../../initSupabase";
import { assertQueryResponse, assertQuerySingleResponse } from "../supabase";

export async function getSnapshotForId(snapshotId: SnapshotId) {
  return assertQuerySingleResponse<Snapshot>(
    () => supabase.from("snapshots").select("*").eq("id", snapshotId).single(),
    `Could not find Snapshot "${snapshotId}"`
  );
}

export async function getSnapshotsForRun(runId: RunId) {
  return await assertQueryResponse<Snapshot>(
    () =>
      supabase
        .from("snapshots")
        .select("*")
        .eq("run_id", runId)
        .order("delta_test_filename", { ascending: true })
        .order("delta_test_name", { ascending: true })
        .order("delta_image_filename", { ascending: true }),
    `Could not find Snapshots for Run "${runId}" `
  );
}

export async function insertSnapshot(
  snapshot: Omit<Snapshot, "created_at" | "id">
) {
  return assertQuerySingleResponse<Snapshot>(
    () => supabase.from("snapshots").insert(snapshot).single(),
    `Could not insert Snapshot`
  );
}

export async function updateSnapshot(
  snapshotId: SnapshotId,
  snapshot: Partial<Snapshot>
) {
  return assertQuerySingleResponse<Snapshot>(
    () =>
      supabase.from("snapshots").update(snapshot).eq("id", snapshotId).single(),
    `Could not update Snapshot "${snapshotId}"`
  );
}
