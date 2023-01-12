import Dropdown from "./Dropdown";
import Image from "next/image";
import { Github } from "./SVGs";
import { ApproveButton } from "./ApproveButton";
import moment from "moment";

export function Header({
  branch,
  projectQuery,
  shownBranches,
  currentAction,
  branchActions,
}) {
  console.log('<Header>', {shownBranches, branchActions})
  return (
    <div className="flex text-black justify-between border-b-2 border-b-slate-100 ">
      <div className="flex items-center py-2 pl-4">
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
          selected={branch}
          options={shownBranches.map((branch, index) => ({
            key: branch.id??index,
            name: branch.name,
            href: `/project/${projectQuery.data.short}/?branch=${branch.name}`,
            badge:
              branch.action_status != "neutral"
                ? branch.num_snapshots_changed
                : "-",
          }))}
        />
      </div>

      {currentAction && (
        <div className="flex items-center">
          <div className={`font-medium px-2 mr-4 text-violet-400  `}>
            {
              <Dropdown
                selected={relativeTime(currentAction.created_at)}
                options={branchActions.map((branch, index) => ({
                  key: branch.id??index,
                  name: relativeTime(branch.created_at),
                  href: `/project/${projectQuery.data.short}/?branch=${branch.Branches?.name}&action=${branch.id}`,
                  isSelected: branch.id == currentAction.id,
                  badge: branch.num_snapshots_changed || "-",
                }))}
              />
            }
          </div>

          <a
            _target="blank"
            href={`https://github.com/${projectQuery.data?.organization}/${projectQuery.data?.repository}/pull/${currentAction?.Branches?.pr_number}`}
            className="mr-4 fill-violet-400 hover:fill-violet-500 "
          >
            <Github />
          </a>

          <ApproveButton
            branch={branch}
            projectQuery={projectQuery}
            currentAction={currentAction}
          />
        </div>
      )}
    </div>
  );
}

// transfor a date into a relative time from now
// e.g. 2 days ago
export function relativeTime(date) {
  return moment(date).fromNow();
}
