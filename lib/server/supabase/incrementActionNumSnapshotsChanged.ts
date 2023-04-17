import { supabase, createError, retryOnError } from "./supabase";
import { getBranchFromProject } from "./branches";
import { getActionFromBranch } from "./actions";
import { safeStringify } from "../json";

export async function incrementActionNumSnapshotsChanged(
  projectId: string,
  branchName: string
) {
  const branch = await getBranchFromProject(projectId, branchName);
  if (branch.error) {
    return createError(
      `Branch with name "${branchName}" not found for project "${projectId}"`
    );
  }
  const action = await getActionFromBranch(branch.data.id);
  if (action.error) {
    return createError(
      `Action not found for ${branchName} and ${
        branch.data.id
      }: ${safeStringify(action.error)}`
    );
  }

  return retryOnError(() =>
    supabase.rpc("snapshots_changed_inc", {
      action_id: action.data.id,
    })
  );
}
