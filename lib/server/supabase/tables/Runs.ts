import { BranchId, GithubRunId, Run, RunId } from "../../../types";
import { supabase } from "../../initSupabase";
import {
  assertQueryMaybeSingleResponse,
  assertQueryResponse,
  assertQuerySingleResponse,
} from "../supabase";

export async function getMostRecentSuccessfulRunForBranch(branchId: BranchId) {
  return assertQueryMaybeSingleResponse<Run>(
    () =>
      supabase
        .from("runs")
        .select("*")
        .eq("branch_id", branchId)
        .eq("github_conclusion", "success")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    `Could not find Runs for Branch "${branchId}"`
  );
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
        .order("created_at", { ascending: false, foreignTable: "runs" })
        .limit(limit),
    `Could not find Runs for Branch "${branchId}"`
  );
  return result.length === 0 ? [] : (result[0].runs as Run[]);
}

export async function getRunForGithubRunId(githubRunId: GithubRunId) {
  return assertQuerySingleResponse<Run>(
    () =>
      supabase
        .from("runs")
        .select("*")
        .eq("github_run_id", githubRunId)
        .single(),
    `Could not find Run for GitHub run "${githubRunId}"`
  );
}

export async function insertRun(data: Omit<Run, "created_at" | "id">) {
  return assertQuerySingleResponse<Run>(
    () => {
      console.log(`Trying to insert run with id ${data.github_run_id} and check_id ${data.github_check_id}`);
      return supabase.from("runs").insert(data).single();
    },
    `Could not insert Run`
  );
}

export async function updateRun(runId: RunId, run: Partial<Run>) {
  return assertQuerySingleResponse<Run>(
    () => supabase.from("runs").update(run).eq("id", runId).single(),
    `Could not update Run "${runId}"`
  );
}
