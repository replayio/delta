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
} from "./supabase";
import { getBranchFromProject } from "./branches";
import {
  getActionFromBranch,
  getActionsFromBranch,
  incrementActionNumSnapshots,
} from "./actions";

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

  return supabase
    .from("Snapshots")
    .select("*")
    .eq("file", file)
    .eq("action_id", action.data.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
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
  return supabase.from("Snapshots").select("*").eq("action_id", action.id);
}

export async function getSnapshotsForAction(
  actionId: string
): Promise<PostgrestResponse<Snapshot>> {
  return supabase.from("Snapshots").select("*").eq("action_id", actionId);
}

export async function insertSnapshot(
  branchName,
  projectId,
  image,
  runId
): Promise<ResponseError | PostgrestSingleResponse<Snapshot>> {
  const branch = await getBranchFromProject(projectId, branchName);
  if (branch.error) {
    return createError(`Branch not found for ${branchName}`);
  }

  const action = await getActionFromBranch(branch.data.id, runId);
  if (action.error) {
    return createError(
      `Action not found for ${branchName} and ${
        branch.data.id
      }: ${JSON.stringify(action.error)}`
    );
  }

  const sha = createHash("sha256").update(image.content).digest("hex");

  await incrementActionNumSnapshots(action.data.id);

  const snapshot: Partial<Snapshot> = {
    action_id: action.data.id,
    path: `${projectId}/${sha}.png`,
    file: image.file,
  };

  return supabase.from("Snapshots").insert(snapshot).single();
}

export async function updateSnapshot(
  snapshotId: string,
  snapshot: Partial<Snapshot>
): Promise<PostgrestSingleResponse<Snapshot>> {
  return supabase
    .from("Snapshots")
    .update(snapshot)
    .eq("id", snapshotId)
    .single();
}
