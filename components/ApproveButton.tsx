import { useState } from "react";

import { Action, Branch, Project } from "../lib/server/supabase/supabase";
import { updateBranchStatus } from "../utils/ApiClient";

export function ApproveButton({
  currentAction,
  currentBranch,
  project,
}: {
  currentAction: Action;
  currentBranch: Branch;
  project: Project;
}) {
  const [isUpdating, setUpdating] = useState(false);

  const toggleBranchStatus = async (status) => {
    setUpdating(true);

    await updateBranchStatus({
      branchId: currentBranch.id,
      projectId: project.id,
      status,
    });

    setUpdating(false);
  };

  // Don't show the approve button if:
  // - the branch has no changes
  // - the branch has a currently running action
  if (
    currentAction.num_snapshots_changed === 0 ||
    currentBranch?.status == "neutral"
  ) {
    return null;
  }

  if (isUpdating) {
    return (
      <div className="text-white bg-violet-300 py-1 px-3 rounded border-transparent">
        Updating
      </div>
    );
  }

  if (
    currentBranch?.status == "success" ||
    (currentAction?.status == "success" &&
      currentAction?.num_snapshots_changed > 0)
  ) {
    return (
      <div className="flex items-center">
        <button
          onClick={() => toggleBranchStatus("failure")}
          className="text-white bg-violet-500 py-1 px-3 rounded border-transparent hover:bg-violet-600"
        >
          Reject
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <button
        onClick={() => toggleBranchStatus("success")}
        className="text-white bg-violet-500 py-1 px-3 rounded border-transparent hover:bg-violet-600"
      >
        Approve
      </button>
    </div>
  );
}
