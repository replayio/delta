import moment from "moment";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Action, Branch, Project } from "../lib/server/supabase/supabase";
import { fetchMostRecentActionForBranchSuspense } from "../suspense/ActionCache";
import classNames from "../utils/classNames";
import { ApproveButton } from "./ApproveButton";
import Dropdown from "./Dropdown";
import { Github } from "./SVGs";
import { Toggle } from "./Toggle";

export function Header({
  actions,
  branches,
  currentAction,
  currentBranch,
  project,
}: {
  actions: Action[] | null;
  branches: Branch[];
  currentAction: Action | null;
  currentBranch: Branch | null;
  project: Project;
}) {
  // Debug logging
  // if (process.env.NODE_ENV === "development") {
  //   console.groupCollapsed("<Header>");
  //   console.log("branches:", branches);
  //   console.log("current branch:", currentBranch);
  //   console.log("actions:", actions);
  //   console.log("current action:", currentAction);
  //   console.log("project:", project);
  //   console.groupEnd();
  // }

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
        <Dropdown
          align="left"
          options={branches.map((branch) => ({
            isSelected: branch.name === currentBranch?.name,
            key: branch.id,
            render: () => (
              <Suspense fallback="Loading...">
                <BranchDropDownItem branch={branch} project={project} />
              </Suspense>
            ),
          }))}
          selected={currentBranch?.name ?? "–"}
        />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <Toggle />
      </div>

      <div className="flex-1 flex justify-end items-center gap-2 text-violet-400">
        {actions && (
          <Dropdown
            align="right"
            options={actions.map((action) => ({
              isSelected: action.id == currentAction?.id,
              key: action.id,
              render: () => (
                <ActionDropDownItem
                  action={action}
                  currentBranchName={currentBranch?.name || ""}
                  project={project}
                />
              ),
            }))}
            selected={
              currentAction ? relativeTime(currentAction.created_at) : "-"
            }
          />
        )}

        <a
          className="fill-violet-500 hover:fill-violet-600 "
          href={`https://github.com/${project?.organization}/${project?.repository}/pull/${currentBranch?.pr_number}`}
          rel="noreferrer noopener"
          target="_blank"
        >
          <Github />
        </a>

        {currentAction && currentBranch && (
          <ApproveButton
            currentAction={currentAction}
            currentBranch={currentBranch}
            project={project}
          />
        )}
      </div>
    </div>
  );
}

function ActionDropDownItem({
  action,
  currentBranchName,
  project,
}: {
  action: Action;
  currentBranchName: string;
  project: Project;
}) {
  const count = action.num_snapshots_changed || 0;

  return (
    <Link
      className="h-full w-full"
      href={`/project/${project.short}/?branch=${currentBranchName}&action=${action.id}`}
    >
      <div className="flex justify-between w-full">
        <div
          className={classNames(
            "truncate pr-4",
            count === 0 && "text-slate-400"
          )}
        >
          {relativeTime(action.created_at)}
        </div>
        {count > 0 && (
          <div className="bg-violet-500 px-2 rounded text-white text-xs font-bold flex items-center">
            {count}
          </div>
        )}
      </div>
    </Link>
  );
}

function BranchDropDownItem({
  branch,
  project,
}: {
  branch: Branch;
  project: Project;
}) {
  const action = fetchMostRecentActionForBranchSuspense(branch.id);
  const count = action.num_snapshots_changed || 0;

  return (
    <Link
      className="h-full w-full"
      href={`/project/${project.short}/?branch=${branch.name}`}
    >
      <div className="flex justify-between w-full">
        <div
          className={classNames(
            "truncate pr-4",
            count === 0 && "text-slate-400"
          )}
        >
          {branch.name}
        </div>
        {count > 0 && (
          <div className="bg-violet-500 px-2 rounded text-white text-xs font-bold flex items-center">
            {count}
          </div>
        )}
      </div>
    </Link>
  );
}

// transfor a date into a relative time from now
// e.g. 2 days ago
export function relativeTime(date) {
  return moment(date).fromNow();
}
