import Image from "next/image";
import { useContext } from "react";
import { branchCache } from "../suspense/BranchCache";
import { projectCache } from "../suspense/ProjectCache";
import { runsCache } from "../suspense/RunCache";
import { ApproveButton } from "./ApproveButton";
import { BranchDropDownMenu } from "./BranchDropDownMenu";
import { RunDropDownMenu } from "./RunDropDown";
import { Github } from "./SVGs";
import { SessionContext } from "./SessionContext";
import { Toggle } from "./Toggle";

export function Header() {
  const { branchIdDeferred, isRunPending, projectSlug, runIdDeferred } =
    useContext(SessionContext);

  const project = projectCache.read(projectSlug);
  const currentBranch =
    branchIdDeferred != null ? branchCache.read(branchIdDeferred) : null;
  const runs = branchIdDeferred != null ? runsCache.read(branchIdDeferred) : [];
  const currentRun = runIdDeferred
    ? runs.find((run) => run.id === runIdDeferred)
    : null;

  return (
    <div className="flex text-black justify-between bg-slate-100 py-1 px-4 whitespace-nowrap">
      <div className="flex-1 flex items-center">
        <div className="mr-2">
          <Image
            className="fill-violet-500"
            width={16}
            height={16}
            src="/logo.svg"
            alt="Replay logo"
          />
        </div>
        <BranchDropDownMenu />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <Toggle />
      </div>

      <div className="flex-1 flex justify-end items-center gap-2 ">
        <RunDropDownMenu />
        <a
          className="fill-violet-500 hover:fill-violet-600 "
          href={`https://github.com/${project?.organization}/${project?.repository}`}
          rel="noreferrer noopener"
          target="_blank"
        >
          <Github />
        </a>

        {currentRun && currentBranch && (
          <ApproveButton
            branch={currentBranch}
            isPending={isRunPending}
            project={project}
            run={currentRun}
          />
        )}
      </div>
    </div>
  );
}
