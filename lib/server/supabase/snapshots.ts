import {
  PostgrestResponse,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";
const { createHash } = require("crypto");
import {
  Snapshot,
  getBranchFromProject,
  getActionFromBranch,
  supabase,
  ResponseError,
  createError,
  getActionsFromBranch,
  incrementActionNumSnapshots,
  incrementActionNumSnapshotsChanged,
} from "./supabase";

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
    console.log(
      `getSnapshotsFromBranch(${projectId}, ${branchName})`,
      action.id
    );

    const snapshots = await supabase
      .from("Snapshots")
      .select("*")
      .eq("action_id", action.id);

    if (snapshots.error) {
      continue;
    }

    if (snapshots.data.length > 0) {
      return snapshots;
    }
  }

  return createError("No snapshots found");
}

export async function getSnapshotsForAction(
  actionId: string
): Promise<PostgrestResponse<Snapshot>> {
  return supabase.from("Snapshots").select("*").eq("action_id", actionId);
}

export async function insertSnapshot({
  branchName,
  projectId,
  image,
  status,
  primary_changed,
  action_changed = false,
  primary_diff_path = "",
}): Promise<ResponseError | PostgrestSingleResponse<Snapshot>> {
  const branch = await getBranchFromProject(projectId, branchName);
  if (branch.error) {
    return createError(`Branch not found for ${branchName}`);
  }
  const action = await getActionFromBranch(branch.data.id);
  if (action.error) {
    return createError(
      `Action not found for ${branchName} and ${
        branch.data.id
      }: ${JSON.stringify(action.error)}`
    );
  }

  const sha = createHash("sha256").update(image.content).digest("hex");

  await incrementActionNumSnapshots(action.data.id);

  if (primary_changed) {
    await incrementActionNumSnapshotsChanged(action.data.id);
  }

  return supabase
    .from("Snapshots")
    .insert({
      sha,
      action_id: action.data.id,
      path: `${projectId}/${sha}.png`,
      file: image.file,
      status,
      action_changed,
      primary_changed,
      primary_diff_path,
    })
    .single();
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
