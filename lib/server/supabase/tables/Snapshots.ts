import {
  BranchId,
  GithubRunId,
  ProjectId,
  RunId,
  Snapshot,
  SnapshotId,
} from "../../../types";
import {
  assertQueryResponse,
  assertQuerySingleResponse,
  supabase,
} from "../supabase";
import { getOpenPullRequestForBranch } from "./PullRequests";
import { getRunsForPullRequest } from "./Runs";

export async function getMostRecentSnapshotForBranchAndFile(
  branchId: BranchId,
  file: string
): Promise<Snapshot> {
  const pullRequest = await getOpenPullRequestForBranch(branchId);
  if (!pullRequest) {
    throw Error(`Could not find open PullRequest for Branch "${branchId}"`);
  }

  const runs = await getRunsForPullRequest(pullRequest.id);
  const mostRecentRun = runs[runs.length - 1];
  const snapshot = await assertQuerySingleResponse<Snapshot>(
    () =>
      supabase
        .from("snapshots")
        .select("*")
        .eq("file", file)
        .eq("run_id", mostRecentRun.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
    `Could not find Snapshot for Run "${mostRecentRun.id}" and file "${file}"`
  );

  return snapshot;
}

export async function getRecentlyUpdatedSnapshotsForProject(
  projectId: ProjectId,
  afterDate: Date,
  limit: number = 1000
) {
  return await assertQueryResponse<Snapshot>(
    () =>
      supabase
        .from("snapshots, runs(branches(projects()))")
        .select("*")
        .eq("projects.id", projectId)
        .gte("snapshots.created_at", afterDate.toLocaleDateString())
        .order("file")
        .limit(limit),
    `Could not find Snapshots for Project "${projectId}" after date "${afterDate.toLocaleDateString()}"`
  );
}

export async function getSnapshotsForGithubRun(githubRunId: GithubRunId) {
  return await assertQueryResponse<Snapshot>(
    () =>
      supabase
        .from("snapshots, runs()")
        .select("*")
        .eq("runs.github_run_id", githubRunId)
        .order("file"),
    `Could not find Snapshots for GitHub run "${githubRunId}"`
  );
}

export async function getSnapshotsForRun(runId: RunId) {
  return await assertQueryResponse<Snapshot>(
    () =>
      supabase.from("snapshots").select("*").eq("run_id", runId).order("file"),
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
