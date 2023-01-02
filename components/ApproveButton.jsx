import { useState } from "react";
import { useFetchSnapshots } from "../hooks/useFetchSnapshots";

export function ApproveButton({ branch, projectQuery, currentAction }) {
  const { data, error, isLoading } = useFetchSnapshots(branch, projectQuery);
  const [newBranch, setBranch] = useState(null);
  if (isLoading) {
    return null;
  }

  const hasChanged = data?.some((snapshot) => snapshot.primary_changed);

  // Don't show the approve button if:
  // - the branch has no changes
  // - the branch has already been approved
  // - the branch has a currently running action
  if (!hasChanged || ["success", "neutral"].includes(currentAction?.status)) {
    return null;
  }

  if (newBranch?.status == "success") {
    return (
      <div className="flex items-center">
        <button className="font-medium py-1 px-2 rounded mr-4">Approved</button>
      </div>
    );
  }

  const approveBranch = async () => {
    console.log({
      branch,
      status: "success",
      projectId: projectQuery.data.id,
    });

    const res = await fetch("/api/updateBranchStatus", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        branch,
        status: "success",
        projectId: projectQuery.data.id,
      }),
    });

    const body = await res.json();
    setBranch(body);
  };

  return (
    <div className="flex items-center">
      <button
        onClick={() => approveBranch()}
        className="bg-violet-500 hover:bg-violet-700 text-white font-medium  py-1 px-2 rounded mr-4"
      >
        Approve
      </button>
    </div>
  );
}
