import moment from "moment";
import Image from "next/image";
import Link from "next/link";
import { isPromiseLike } from "suspense";
import { Branch, Project, Run } from "../lib/types";
import { mostRecentRunCache } from "../suspense/RunCache";
import { snapshotDiffForRunCache } from "../suspense/SnapshotCache";
import classNames from "../utils/classNames";
import { ApproveButton } from "./ApproveButton";
import Dropdown from "./Dropdown";
import { Github } from "./SVGs";
import { Toggle } from "./Toggle";
import withSuspenseLoader from "./withSuspenseLoader";

export function Header({
  branches,
  currentBranch,
  currentRun,
  project,
  runs,
}: {
  branches: Branch[];
  currentBranch: Branch;
  currentRun: Run;
  project: Project;
  runs: Run[];
}) {
  // Debug logging
  // if (process.env.NODE_ENV === "development") {
  //   console.groupCollapsed("<Header>");
  //   console.log("branches:", branches);
  //   console.log("current branch:", currentBranch);
  //   console.log("workflow runs:", runs);
  //   console.log("current workflow run:", currentRun);
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
              <BranchDropDownItem branch={branch} project={project} />
            ),
          }))}
          selected={currentBranch?.name ?? "–"}
        />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <Toggle />
      </div>

      <div className="flex-1 flex justify-end items-center gap-2 text-violet-400">
        {runs && (
          <Dropdown
            align="right"
            options={runs.map((run) => ({
              isSelected: run.id == currentRun?.id,
              key: run.id,
              render: () => (
                <RunDropDownItem
                  currentBranchName={currentBranch?.name || ""}
                  project={project}
                  run={run}
                />
              ),
            }))}
            selected={currentRun ? relativeTime(currentRun.created_at) : "-"}
          />
        )}

        <a
          className="fill-violet-500 hover:fill-violet-600 "
          href={`https://github.com/${project?.organization}/${project?.repository}/pull/${currentBranch.github_pr_number}`}
          rel="noreferrer noopener"
          target="_blank"
        >
          <Github />
        </a>

        {currentRun && currentBranch && (
          <ApproveButton
            branch={currentBranch}
            project={project}
            run={currentRun}
          />
        )}
      </div>
    </div>
  );
}

const RunDropDownItem = withSuspenseLoader(function RunDropDownItem({
  currentBranchName,
  project,
  run,
}: {
  currentBranchName: string;
  project: Project;
  run: Run;
}) {
  const snapshotDiffs = snapshotDiffForRunCache.read(run.id);
  const count = snapshotDiffs.length;

  // Debug logging
  // if (process.env.NODE_ENV === "development") {
  //   console.groupCollapsed("<RunDropDownItem>");
  //   console.log("project:", project);
  //   console.log("currentBranchName:", currentBranchName);
  //   console.log("run:", run);
  //   console.log("snapshotDiffs:", snapshotDiffs);
  //   console.groupEnd();
  // }

  return (
    <Link
      className="h-full w-full"
      href={`/project/${project.slug}/?branch=${currentBranchName}&run=${run.id}`}
    >
      <div className="flex justify-between w-full">
        <div
          className={classNames(
            "truncate pr-4",
            count === 0 && "text-slate-400"
          )}
        >
          {relativeTime(run.created_at)}
        </div>
        {count > 0 && (
          <div className="bg-violet-500 px-2 rounded text-white text-xs font-bold flex items-center">
            {count}
          </div>
        )}
      </div>
    </Link>
  );
});

const BranchDropDownItem = withSuspenseLoader(function BranchDropDownItem({
  branch,
  project,
}: {
  branch: Branch;
  project: Project;
}) {
  let run: Run | null = null;
  try {
    run = mostRecentRunCache.read(branch.id);
  } catch (errorOrThennable) {
    if (isPromiseLike(errorOrThennable)) {
      throw errorOrThennable;
    } else {
      // Ignore branches with no Workflow runs.
    }
  }

  if (run == null) {
    return (
      <div className="h-full w-full cursor-default">
        <div className="flex justify-between w-full">
          <div className="truncate pr-4 text-slate-400">{branch.name}</div>
        </div>
      </div>
    );
  }

  const snapshotDiffs = snapshotDiffForRunCache.read(run.id);
  const count = snapshotDiffs.length;

  // Debug logging
  // if (process.env.NODE_ENV === "development") {
  //   console.groupCollapsed("<BranchDropDownItem>");
  //   console.log("run:", run);
  //   console.log("snapshotDiffs:", snapshotDiffs);
  //   console.groupEnd();
  // }

  return (
    <Link
      className="h-full w-full"
      href={`/project/${project.slug}/?branch=${branch.name}`}
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
});

// Transform a date into a relative time from now, e.g. 2 days ago
function relativeTime(date) {
  return moment(date).fromNow();
}
