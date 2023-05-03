import { BranchId, PullRequest, PullRequestId, RunId } from "../../../types";
import {
  assertQuerySingleResponse,
  assertQuerySingleResponseOrNull,
  supabase,
} from "../supabase";

export async function getOpenPullRequestForBranch(branchId: BranchId) {
  return assertQuerySingleResponseOrNull<PullRequest>(
    () =>
      supabase
        .from("pull_requests")
        .select("*")
        .eq("branch_id", branchId)
        .eq("status", "open")
        .single(),
    `Could not find PullRequests for Branch "${branchId}"`
  );
}

export async function getPullRequestForId(id: PullRequestId) {
  return assertQuerySingleResponse<PullRequest>(
    () => supabase.from("pull_requests").select("*").eq("id", id).single(),
    `Could not find PullRequest "${id}"`
  );
}

export async function getPullRequestForGitHubPrNumber(
  projectOrganization: string,
  projectRepository: string,
  pullRequestNumber: number
) {
  return assertQuerySingleResponse<PullRequest>(
    () =>
      supabase
        .from("pull_requests, branches(projects())")
        .select("*")
        .eq("github_pr_number", pullRequestNumber)
        .eq("projects.organization", projectOrganization)
        .eq("repository", projectRepository)
        .single(),
    `Could not find PullRequest for GitHub PR ${pullRequestNumber}`
  );
}

export async function getPullRequestForRun(runId: RunId) {
  return assertQuerySingleResponse<PullRequest>(
    () =>
      supabase
        .from("pull_requests, runs()")
        .select("*")
        .eq("runs.id", runId)
        .single(),
    `Could not find PullRequest for Run "${runId}"`
  );
}

export async function insertPullRequest(
  data: Omit<PullRequest, "created_at" | "id">
) {
  return assertQuerySingleResponse<PullRequest>(
    () => supabase.from("pull_requests").insert(data).single(),
    `Could not insert PullRequest`
  );
}

export async function updatePullRequest(
  id: PullRequestId,
  pullRequest: Partial<Omit<PullRequest, "created_at" | "id">>
) {
  return assertQuerySingleResponse<PullRequest>(
    () =>
      supabase.from("pull_requests").update(pullRequest).eq("id", id).single(),
    `Could not update PullRequest "${id}"`
  );
}
