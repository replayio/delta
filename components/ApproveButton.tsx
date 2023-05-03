import { useState } from "react";

import { Branch, Project, Run } from "../lib/types";
import { snapshotDiffForRunCache } from "../suspense/SnapshotCache";
import { updateBranchStatus } from "../utils/ApiClient";
import withSuspenseLoader from "./withSuspenseLoader";

export const ApproveButton = withSuspenseLoader(function ApproveButton({
  branch,
  project,
  run,
}: {
  branch: Branch;
  project: Project;
  run: Run;
}) {
  const [isPending, setIsPending] = useState(false);
  const [hasApproval, setHasApproval] = useState<boolean>(
    run.delta_has_user_approval
  );

  if (run.github_status === "queued") {
    return (
      <div className="text-white bg-violet-300 py-1 px-3 rounded border-transparent">
        Updating
      </div>
    );
  }

  const snapshotDiffs = snapshotDiffForRunCache.read(run.id);
  const requiresApproval = snapshotDiffs.length > 0;
  if (!requiresApproval) {
    return null;
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
        disabled={isPending}
        onClick={onClick}
        className="text-white bg-violet-500 py-1 px-3 rounded border-transparent hover:bg-violet-600"
      >
        {hasApproval ? "Reject" : "Approve"}
      </button>
    </div>
  );
});
