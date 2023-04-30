import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { BranchId, Run, RunId, GithubRunId } from "../../types";
import { retryOnError, supabase } from "./supabase";

export async function getRun(
  runId: RunId
): Promise<PostgrestSingleResponse<Run>> {
  return retryOnError(() =>
    supabase.from("Runs").select("*").eq("id", runId).single()
  );
}

export async function getRunForGithubRun(
  githubRunId: GithubRunId
): Promise<PostgrestSingleResponse<Run>> {
  return retryOnError(() =>
    supabase.from("Runs").select("*").eq("github_run_id", githubRunId).single()
  );
}

export async function getRunForBranch(
  branchId: BranchId,
  githubRunId?: GithubRunId
): Promise<PostgrestSingleResponse<Run>> {
  let query = supabase.from("Runs").select("*").eq("branch_id", branchId);
  if (githubRunId) {
    query = query.eq("github_run_id", githubRunId);
  }

  return retryOnError(() =>
    query.order("created_at", { ascending: false }).limit(1).single()
  );
}

export async function incrementNumSnapshots(runId: RunId) {
  return retryOnError(() =>
    supabase.rpc("increment_snapshots_count", {
      run_id: runId,
    })
  );
}

export async function incrementNumSnapshotsChanged(runId: RunId) {
  return retryOnError(() =>
    supabase.rpc("increment_snapshots_changed_count", {
      run_id: runId,
    })
  );
}

export async function insertRun(
  data: Pick<
    Run,
    | "actor"
    | "branch_id"
    | "github_run_id"
    | "num_snapshots"
    | "num_snapshots_changed"
    | "status"
  >
): Promise<PostgrestSingleResponse<Run>> {
  return retryOnError(() => supabase.from("Runs").insert(data).single());
}

export async function updateRun(
  runId: RunId,
  run: Partial<Run>
): Promise<PostgrestSingleResponse<Run>> {
  return retryOnError(() =>
    supabase.from("Runs").update(run).eq("id", runId).single()
  );
}
