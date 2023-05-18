import {
  BranchId,
  ProjectId,
  RunId,
  Snapshot,
  SnapshotId,
} from "../../../types";
import { supabase } from "../../initSupabase";
import { assertQueryResponse, assertQuerySingleResponse } from "../supabase";
import { getRunsForBranch } from "./Runs";

export async function getMostRecentSnapshotForBranchAndFile(
  branchId: BranchId,
  file: string
): Promise<Snapshot> {
  const runs = await getRunsForBranch(branchId);
  const mostRecentRun = runs[runs.length - 1];
  const snapshot = await assertQuerySingleResponse<Snapshot>(
    () =>
      supabase
        .from("snapshots")
        .select("*")
        .eq("delta_file", file)
        .eq("run_id", mostRecentRun.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
    `Could not find Snapshot for Run "${mostRecentRun.id}" and file "${file}"`
  );

  return snapshot;
}

export async function getSnapshotsForRun(runId: RunId) {
  return await assertQueryResponse<Snapshot>(
    () =>
      supabase
        .from("snapshots")
        .select("*")
        .eq("run_id", runId)
        .order("delta_file", { ascending: true }),
    `Could not find Snapshot for Run "${runId}" `
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
