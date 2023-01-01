import Dropdown from "./Dropdown";
import Image from "next/image";
import { useState } from "react";
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
        <button className="font-bold  py-1 px-2 rounded mr-4">Approved</button>
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
        className="bg-blue-500 hover:bg-blue-700 text-white  py-1 px-2 rounded mr-4"
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
}) {
  return (
    <div className="flex text-black justify-between border-b-2 mb-1 border-b-slate-100 ">
      <div className="flex items-center py-2 pl-4">
        <div style={{ transform: "rotate(-90deg)" }}>
          <Image width={16} height={16} src="/logo.svg" alt="Replay logo" />
        </div>
        <h1 className="pl-2 text-lg">Delta</h1>
        <div className="ml-1 mr-1"> / </div>
        <Dropdown
          onChange={(val) => setBranch(val)}
          selected={branch}
          project={projectQuery.data}
          options={branches
            .filter((i) => i.status == "open")
            .map((b) => b.name)}
        />
      </div>
      <div className="flex">
        <ApproveButton
          branch={branch}
          projectQuery={projectQuery}
          currentAction={currentAction}
        />
        <div className="flex items-center py-2 pr-4">
          {projectQuery.data?.name}
        </div>
      </div>
    </div>
  );
}
