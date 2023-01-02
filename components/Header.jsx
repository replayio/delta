import Dropdown from "./Dropdown";
import Image from "next/image";
import { useState, useMemo } from "react";
import { useFetchSnapshots } from "../hooks/useFetchSnapshots";

function ApproveButton({ branch, projectQuery, currentAction }) {
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

export function Header({
  setBranch,
  branch,
  projectQuery,
  branches,
  currentAction,
  changedSnapshots,
}) {
  const shownBranches = useMemo(
    () =>
      branches
        .filter((i) => i.status == "open")
        .filter((i) => i.name != projectQuery.data.primary_branch),
    [branches, projectQuery]
  );

  return (
    <div className="flex text-black justify-between border-b-2 mb-1 border-b-slate-100 ">
      <div className="flex items-center py-2 pl-4">
        <div style={{ transform: "rotate(-90deg)" }} className="mr-2">
          <Image width={16} height={16} src="/logo.svg" alt="Replay logo" />
        </div>
        <Dropdown
          onChange={(val) => setBranch(val)}
          selected={branch}
          project={projectQuery.data}
          options={shownBranches.map((b) => b.name)}
        />
      </div>
      <div className="flex">
        {changedSnapshots.length > 0 && (
          <div className="flex items-center mr-4 text-gray-600">
            {/* <div className="rounded-lg bg-yellow-300 w-2 h-2 mr-2" /> */}
            <div className="text-gray-500">
              {changedSnapshots.length} Changed
            </div>
          </div>
        )}
        <ApproveButton
          branch={branch}
          projectQuery={projectQuery}
          currentAction={currentAction}
        />
      </div>
    </div>
  );
}
