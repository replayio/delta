import {
  BranchId,
  GithubRunId,
  PullRequestId,
  Run,
  RunId,
} from "../../../types";
import {
  assertQueryResponse,
  assertQuerySingleResponse,
  supabase,
} from "../supabase";

export async function getRunForGithubRun(githubRunId: GithubRunId) {
  return assertQuerySingleResponse<Run>(
    () =>
      supabase
        .from("runs")
        .select("*")
        .eq("github_run_id", githubRunId)
        .single(),
    `Could not find Run for GithubRunId "${githubRunId}"`
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
  return assertQueryResponse<Run>(
    () =>
      supabase
        .from("runs")
        .select("*, pull_requests(branch())")
        .eq("branch.id", branchId)
        .order("created_at", { ascending: false })
        .limit(limit),
    `Could not find Runs for Branch "${branchId}"`
  );
}

export async function getRunsForPullRequest(pullRequestId: PullRequestId) {
  return assertQueryResponse<Run>(
    () =>
      supabase
        .from("runs")
        .select("*")
        .eq("pull_request_id", pullRequestId)
        .order("created_at", { ascending: false }),
    `Could not find Runs for PullRequest "${pullRequestId}"`
  );
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
