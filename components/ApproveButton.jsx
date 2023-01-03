import { useEffect, useState } from "react";
import { useFetchSnapshots } from "../hooks/useFetchSnapshots";

export function ApproveButton({ branch, projectQuery, currentAction }) {
  const { data, error, isLoading } = useFetchSnapshots(branch, projectQuery);
  const [currentBranch, setBranch] = useState(null);

  useEffect(() => {
    setBranch(branch);
  }, []);

  const toggleBranchStatus = async (status) => {
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
        status,
        projectId: projectQuery.data.id,
      }),
    });

    const body = await res.json();
    console.log("res", body.action);
    setBranch(body.action);
  };

  if (isLoading) {
    return null;
  }

  const hasChanged = data?.some((snapshot) => snapshot.primary_changed);

  // Don't show the approve button if:
  // - the branch has no changes
  // - the branch has a currently running action
  if (!hasChanged || currentBranch?.status == "neutral") {
    return null;
  }

  if (currentBranch?.status == "success") {
    return (
      <div className="flex items-center">
        <button
          onClick={() => toggleBranchStatus("failure")}
          className="font-medium px-2 mr-4 text-violet-400  border-2 border-violet-400 hover:border-violet-500 hover:text-violet-500 rounded-md"
        >
          Changes Approved
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <button
        onClick={() => toggleBranchStatus("success")}
        className="font-medium px-2 mr-4 text-violet-400  border-2 border-violet-400 hover:border-violet-500 hover:text-violet-500 rounded-md"
      >
        Approve
      </button>
    </div>
  );
}
