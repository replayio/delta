import moment from "moment";
import Image from "next/image";
import { Action, Branch, Project } from "../lib/server/supabase/supabase";
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
            // TODO Show number of changed snapshots in a branch;
            // This will require a merged data type from the server
            badge: branch.pr_number,
            href: `/project/${project.short}/?branch=${branch.name}`,
            isSelected: branch.name === currentBranch?.name,
            key: branch.id,
            name: branch.name,
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
              badge: action.num_snapshots_changed || "-",
              href: `/project/${project.short}/?branch=${currentBranch?.name}&action=${action.id}`,
              isSelected: action.id == currentAction?.id,
              key: action.id,
              name: relativeTime(action.created_at),
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

// transfor a date into a relative time from now
// e.g. 2 days ago
export function relativeTime(date) {
  return moment(date).fromNow();
}
