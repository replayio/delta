import { useState } from "react";

import { Branch, Project, Run } from "../lib/types";
import { updateBranchStatus } from "../utils/ApiClient";
import withSuspenseLoader from "./withSuspenseLoader";

export const ApproveButton = withSuspenseLoader(function ApproveButton({
  branch,
  isPending: isPendingExternal,
  project,
  run,
}: {
  branch: Branch;
  isPending: boolean;
  project: Project;
  run: Run;
}) {
  const [isPendingInternal, setIsPending] = useState(false);
  const [hasApproval, setHasApproval] = useState<boolean>(
    run.delta_has_user_approval
  );

  if (run.github_status === "pending") {
    return (
      <div className="text-white bg-violet-300 py-1 px-3 rounded border-transparent">
        Updating...
      </div>
    );
  }

  const onClick = async () => {
    setIsPending(true);

    const newHasApproval = !hasApproval;

    setHasApproval(newHasApproval);

    await updateBranchStatus({
      approved: `${newHasApproval}`,
      branchId: branch.id,
      projectId: project.id,
      runId: run.id,
    });

    setIsPending(false);
  };

  return (
    <div className="flex items-center">
      <button
        disabled={isPendingExternal || isPendingInternal}
        onClick={onClick}
        className={`text-white bg-violet-500 py-1 px-3 rounded border-transparent hover:bg-violet-600 ${
          isPendingExternal || isPendingInternal ? "opacity-50" : ""
        }`}
      >
        {hasApproval ? "Reject" : "Approve"}
      </button>
    </div>
  );
});
