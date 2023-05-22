import moment from "moment";
import Image from "next/image";
import Link from "next/link";
import { useImperativeCacheValue } from "suspense";
import { Branch, Project, Run, RunId } from "../lib/types";
import { mostRecentRunCache } from "../suspense/RunCache";
import { snapshotDiffCountForRunCache } from "../suspense/SnapshotCache";
import { ApproveButton } from "./ApproveButton";
import Dropdown from "./Dropdown";
import Icon from "./Icon";
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
  currentRun: Run | null;
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
            isSelected: branch.id === currentBranch?.id,
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
          href={`https://github.com/${project?.organization}/${project?.repository}`}
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
      href={`/project/${project.slug}/?branchId=${currentBranchName}&runId=${run.id}`}
    >
      <div className="flex w-full gap-1 items-center">
        <div className="truncate grow">{relativeTime(run.created_at)}</div>
        <RunCount runId={run.id} />
      </div>
    </Link>
  );
});

function BranchDropDownItem({
  branch,
  project,
}: {
  branch: Branch;
  project: Project;
}) {
  const { value: run } = useImperativeCacheValue(mostRecentRunCache, branch.id);

  // Debug logging
  // if (process.env.NODE_ENV === "development") {
  //   console.groupCollapsed("<BranchDropDownItem>");
  //   console.log("run:", run);
  //   console.log("snapshotDiffs:", snapshotDiffs);
  //   console.groupEnd();
  // }

  return (
    <Link
      className={`h-full w-full ${
        branch.github_pr_status !== "open" ? "text-gray-400" : ""
      }`}
      href={`/project/${project.slug}/?branchId=${branch.id}`}
      title={`PR ${branch.github_pr_number} (${branch.github_pr_status})`}
    >
      <div className="flex flex-row gap-1 items-center w-full">
        {branch.github_pr_status === "closed" && (
          <div className="text-red-500">
            <Icon type="closed" />
          </div>
        )}
        {branch.github_pr_status === "merged" && (
          <div className="text-green-600">
            <Icon type="merged" />
          </div>
        )}
        {project.organization !== branch.organization && (
          <div className="text-violet-500" title={branch.organization}>
            <Icon type="fork" />
          </div>
        )}
        <div className="truncate grow">{branch.name}</div>
        {run && <RunCount runId={run.id} />}
      </div>
    </Link>
  );
}

const RunCount = withSuspenseLoader(function RunCount({
  runId,
}: {
  runId: RunId;
}) {
  const { value: count } = useImperativeCacheValue(
    snapshotDiffCountForRunCache,
    runId
  );

  if (count === 0) {
    return null;
  }

  return (
    <div className="bg-violet-500 px-2 rounded text-white text-xs font-bold flex items-center">
      {count}
    </div>
  );
});

// Transform a date into a relative time from now, e.g. 2 days ago
function relativeTime(date) {
  return moment(date).fromNow();
}
