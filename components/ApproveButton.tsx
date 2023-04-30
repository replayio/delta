import { useState } from "react";

import { Branch, Run, Project } from "../lib/types";
import { updateBranchStatus } from "../utils/ApiClient";

type ApprovalStatus = "approved" | "needs-approval" | "no-changes";

export function ApproveButton({
  currentBranch,
  currentRun,
  project,
}: {
  currentBranch: Branch;
  currentRun: Run;
  project: Project;
}) {
  const [isPending, setIsPending] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(() =>
    calculateApprovalStatus(currentRun)
  );

  const toggleBranchStatus = async (status) => {
    setIsPending(true);

    const response = await updateBranchStatus({
      branchId: currentBranch.id,
      projectId: project.id,
      status,
    });

    setApprovalStatus(calculateApprovalStatus(response.run));

    setIsPending(false);
  };

  if (isPending) {
    return (
      <div className="text-white bg-violet-300 py-1 px-3 rounded border-transparent">
        Updating
      </div>
    );
  } else {
    switch (approvalStatus) {
      case "no-changes": {
        return null;
      }
      case "approved": {
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
      case "needs-approval": {
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
    }
  }
}

function calculateApprovalStatus(run: Run): ApprovalStatus {
  switch (run.status) {
    case "neutral":
      return "no-changes";
    case "success":
      return run.num_snapshots_changed > 0 ? "approved" : "no-changes";
    case "failure":
      return "needs-approval";
    default:
      throw Error(`Unexpected status: "${run.status}"`);
  }
}
