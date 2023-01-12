import { useState } from "react";

import { useFetchSnapshots } from "../hooks/useFetchSnapshots";

export function ApproveButton({ branch, projectQuery, currentAction }) {
  const { data, isLoading, error } = useFetchSnapshots(
    currentAction,
    projectQuery
  );
  const [currentBranch, setBranch] = useState(null);
  const [isUpdating, setUpdating] = useState(false);

  const toggleBranchStatus = async (status) => {
    console.log("toggleBranchStatus() request:", {
      branch,
      status: "success",
      projectId: projectQuery.data.id,
    });

    setUpdating(true);

    const response = await fetch("/api/updateBranchStatus", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        branch,
        status,
        projectId: projectQuery.data.id,
      }),
    });

    console.log("toggleBranchStatus() response:", await response.text());

    setUpdating(false);

    try {
      const body = await response.json();
      setBranch(body.action);
    } catch (error) {}
  };

  if (isLoading || error || data.error) {
    return null;
  }

  const hasChanged = data?.some((snapshot) => snapshot.primary_changed);

  // Don't show the approve button if:
  // - the branch has no changes
  // - the branch has a currently running action
  if (!hasChanged || currentBranch?.status == "neutral") {
    return null;
  }

  if (isUpdating) {
    return (
      <div className="font-medium mr-4 text-white bg-violet-300 py-1 px-3 rounded border-transparent">
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
          className="font-medium mr-4 text-white bg-violet-500 py-1 px-3 rounded border-transparent hover:bg-violet-600"
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
        className="font-medium mr-4 text-white bg-violet-500 py-1 px-3 rounded border-transparent hover:bg-violet-600"
      >
        Approve
      </button>
    </div>
  );
}
