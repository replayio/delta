import { supabase, createError } from "./supabase";
import { getBranchFromProject } from "./branches";
import { getActionFromBranch } from "./actions";

export async function incrementActionNumSnapshotsChanged(
  projectId,
  branchName
) {
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

  return supabase.rpc("snapshots_changed_inc", {
    action_id: action.data.id,
  });
}
