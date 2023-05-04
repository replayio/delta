import { BranchId, Run, RunId } from "../../../types";
import { supabase } from "../../initSupabase";
import { assertQueryResponse, assertQuerySingleResponse } from "../supabase";

export async function getMostRecentRunForBranch(branchId: BranchId) {
  const branch = await assertQuerySingleResponse<{ runs: Run[] }>(
    () =>
      supabase
        .from("branches")
        .select("id, runs(*)")
        .eq("id", branchId)
        .single(),
    `Could not find Runs for Branch "${branchId}"`
  );
  if (branch.runs.length === 0) {
    throw Error(`Could not find Runs for Branch "${branchId}"`);
  } else {
    return branch.runs[branch.runs.length - 1];
  }
}

export async function getRunForId(runId: RunId) {
  return assertQuerySingleResponse<Run>(
    () => supabase.from("runs").select("*").eq("id", runId).single(),
    `Could not find Run "${runId}"`
  );
}

export async function getRunsForBranch(
  branchId: BranchId,
  limit: number = 1000
) {
  const result = await assertQueryResponse<any>(
    () =>
      supabase
        .from("branches")
        .select("id, runs(*)")
        .eq("id", branchId)
        .order("created_at", { ascending: false })
        .limit(limit),
    `Could not find Runs for Branch "${branchId}"`
  );
  return result.length === 0 ? [] : (result[0].runs as Run[]);
}

export async function insertRun(data: Omit<Run, "created_at" | "id">) {
  return assertQuerySingleResponse<Run>(
    () => supabase.from("runs").insert(data).single(),
    `Could not insert Run`
  );
}

export async function updateRun(runId: RunId, run: Partial<Run>) {
  return assertQuerySingleResponse<Run>(
    () => supabase.from("runs").update(run).eq("id", runId).single(),
    `Could not update Run "${runId}"`
  );
}
