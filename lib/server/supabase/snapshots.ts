import {
  PostgrestResponse,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";
const { createHash } = require("crypto");
import {
  Snapshot,
  supabase,
  ResponseError,
  createError,
  Action,
  SnapshotStatus,
  retryOnError,
} from "./supabase";
import { getBranchFromProject } from "./branches";
import {
  getActionFromBranch,
  getActionsFromBranch,
  incrementActionNumSnapshots,
} from "./actions";
import { Image } from "../../../pages/api/uploadSnapshot";

export async function getSnapshotFromBranch(
  file: string,
  projectId: string,
  branchName: string
): Promise<
  | { error: { message: string; code: null }; data: null }
  | PostgrestSingleResponse<Snapshot>
> {
  const branch = await getBranchFromProject(projectId, branchName);

  if (branch.error) {
    return { error: { message: "Branch not found", code: null }, data: null };
  }

  const action = await getActionFromBranch(branch.data.id);
  if (action.data == null) {
    return { error: { message: "Action not found", code: null }, data: null };
  }

  return retryOnError(() =>
    supabase
      .from("Snapshots")
      .select("*")
      .eq("file", file)
      .eq("action_id", action.data.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
  );
}

export async function getChangedSnapshotsForActions(
  actionIds: string[]
): Promise<PostgrestResponse<Snapshot>> {
  return await retryOnError(() =>
    supabase
      .from("Snapshots")
      .select("action_id, id, file, path, primary_diff_path")
      .in("action_id", actionIds)
      .is("primary_changed", true)
      .order("file", { ascending: true })
  );
}

export async function getSnapshotsFromBranch(
  projectId: string,
  branchName: string
): Promise<ResponseError | PostgrestResponse<Snapshot>> {
  const branch = await getBranchFromProject(projectId, branchName);

  if (branch.error) {
    return createError("Branch not found");
  }

  const actions = await getActionsFromBranch(branch.data.id);

  if (actions.error) {
    return createError("Action not found");
  }

  for (const action of actions.data) {
    const snapshots = await getSnapshotsForAction(action.id);
    if (snapshots.error) {
      continue;
    }

    if (snapshots.data.length > 0) {
      return snapshots;
    }
  }

  return createError("No snapshots found");
}

export async function getSnapshotFromAction(
  action: Action
): Promise<PostgrestResponse<Snapshot>> {
  return retryOnError(() =>
    supabase.from("Snapshots").select("*").eq("action_id", action.id)
  );
}

export async function getSnapshotsForAction(
  actionId: string
): Promise<PostgrestResponse<Snapshot>> {
  return retryOnError(() =>
    supabase.from("Snapshots").select("*").eq("action_id", actionId)
  );
}

export async function insertSnapshot(
  branchName: string,
  projectId: string,
  image: Image,
  runId: string,
  uploadStatus: SnapshotStatus | null
): Promise<ResponseError | PostgrestSingleResponse<Snapshot>> {
  const branch = await getBranchFromProject(projectId, branchName);
  if (branch.error) {
    return createError(
      `Branch with name "${branchName}" not found for project "${projectId}"`
    );
  }

  const action = await getActionFromBranch(branch.data.id, runId);
  if (action.error) {
    return createError(
      `Action not found for branch ${
        branch.data.id
      } ("${branchName}") and run ${runId}\n\n${JSON.stringify(action.error)}`
    );
  }

  const sha = createHash("sha256").update(image.content).digest("hex");

  await incrementActionNumSnapshots(action.data.id);

  const snapshot: Partial<Snapshot> = {
    action_id: action.data.id,
    path: `${projectId}/${sha}.png`,
    file: image.file,
    status: uploadStatus,
  };

  return retryOnError(() =>
    supabase.from("Snapshots").insert(snapshot).single()
  );
}

export async function updateSnapshot(
  snapshotId: string,
  snapshot: Partial<Snapshot>
): Promise<PostgrestSingleResponse<Snapshot>> {
  return retryOnError(() =>
    supabase.from("Snapshots").update(snapshot).eq("id", snapshotId).single()
  );
}
