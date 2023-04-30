import {
  PostgrestResponse,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";
import { Image } from "../../../pages/api/uploadSnapshot";
import {
  RunId,
  ProjectId,
  GithubRunId,
  Snapshot,
  SnapshotId,
  SnapshotStatus,
} from "../../types";
import { getBranchForProject } from "./branches";
import { getRunForBranch, incrementNumSnapshots } from "./runs";
import { ResponseError, createError, retryOnError, supabase } from "./supabase";
const { createHash } = require("crypto");

export async function getMostRecentlyChangedSnapshotsForProject(
  projectId: ProjectId,
  afterDate: Date = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
  limit: number = 1000
): Promise<PostgrestResponse<Snapshot>> {
  return await retryOnError(() =>
    supabase.rpc("recently_updated_snapshots_for_project", {
      project_id: projectId,
      after_created_at: afterDate.toISOString(),
      max_limit: limit,
    })
  );
}

export async function getSnapshotForBranch(
  projectId: ProjectId,
  branchName: string,
  file: string
): Promise<
  | { error: { message: string; code: null }; data: null }
  | PostgrestSingleResponse<Snapshot>
> {
  const branch = await getBranchForProject(projectId, branchName);
  if (branch.error) {
    return { error: { message: "Branch not found", code: null }, data: null };
  }

  const run = await getRunForBranch(branch.data.id);
  if (run.data == null) {
    return { error: { message: "Job not found", code: null }, data: null };
  }

  const result = await retryOnError(() =>
    supabase
      .from("Snapshots")
      .select("*")
      .eq("file", file)
      .eq("run_id", run.data.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
  );

  if (result.data) {
    return result.data;
  }

  return {
    error: { message: `Snapshot not found for file "${file}"`, code: null },
    data: null,
  };
}

export async function getSnapshotsForBranch(
  projectId: ProjectId,
  branchName: string
): Promise<ResponseError | PostgrestResponse<Snapshot>> {
  return supabase.rpc("snapshots_for_most_recent_run_on_branch", {
    project_id: projectId,
    branch_name: branchName,
  });
}

export async function getSnapshotsForJob(
  runId: RunId
): Promise<PostgrestResponse<Snapshot>> {
  return await retryOnError(() =>
    supabase.from("Snapshots").select("*").eq("run_id", runId).order("file")
  );
}

export async function getSnapshotsForRun(
  runId: GithubRunId
): Promise<PostgrestResponse<Snapshot>> {
  return retryOnError(() =>
    supabase.rpc("snapshots_for_github_run", { github_run_id: runId })
  );
}

export async function insertSnapshot(
  branchName: string,
  projectId: ProjectId,
  image: Image,
  githubRunId: GithubRunId,
  uploadStatus: SnapshotStatus | null
): Promise<ResponseError | PostgrestSingleResponse<Snapshot>> {
  const branch = await getBranchForProject(projectId, branchName);
  if (branch.error) {
    return createError(
      `Branch with name "${branchName}" not found for project "${projectId}"`
    );
  }

  const run = await getRunForBranch(branch.data.id, githubRunId);
  if (run.error) {
    return createError(
      `Job not found for branch ${
        branch.data.id
      } ("${branchName}") and run ${githubRunId}\n\n${JSON.stringify(
        run.error
      )}`
    );
  }

  const sha = createHash("sha256").update(image.content).digest("hex");

  await incrementNumSnapshots(run.data.id);

  const snapshot: Partial<Snapshot> = {
    run_id: run.data.id,
    path: `${projectId}/${sha}.png`,
    file: image.file,
    status: uploadStatus,
  };

  return retryOnError(() =>
    supabase.from("Snapshots").insert(snapshot).single()
  );
}

export async function updateSnapshot(
  snapshotId: SnapshotId,
  snapshot: Partial<Snapshot>
): Promise<PostgrestSingleResponse<Snapshot>> {
  return retryOnError(() =>
    supabase.from("Snapshots").update(snapshot).eq("id", snapshotId).single()
  );
}
