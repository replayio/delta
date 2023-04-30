import moment from "moment";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { isPromiseLike } from "suspense";
import { Branch, Job, Project } from "../lib/types";
import { mostRecentJobCache } from "../suspense/JobCache";
import classNames from "../utils/classNames";
import { ApproveButton } from "./ApproveButton";
import Dropdown from "./Dropdown";
import { Github } from "./SVGs";
import { Toggle } from "./Toggle";

export function Header({
  branches,
  currentBranch,
  currentJob,
  project,
  jobs,
}: {
  branches: Branch[];
  currentBranch: Branch | null;
  currentJob: Job | null;
  project: Project;
  jobs: Job[] | null;
}) {
  // Debug logging
  // if (process.env.NODE_ENV === "development") {
  //   console.groupCollapsed("<Header>");
  //   console.log("branches:", branches);
  //   console.log("current branch:", currentBranch);
  //   console.log("workflow jobs:", jobs);
  //   console.log("current workflow job:", currentJob);
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
        {jobs && (
          <Dropdown
            align="right"
            options={jobs.map((job) => ({
              isSelected: job.id == currentJob?.id,
              key: job.id,
              render: () => (
                <JobDropDownItem
                  currentBranchName={currentBranch?.name || ""}
                  project={project}
                  job={job}
                />
              ),
            }))}
            selected={currentJob ? relativeTime(currentJob.created_at) : "-"}
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

        {currentJob && currentBranch && (
          <ApproveButton
            currentBranch={currentBranch}
            currentJob={currentJob}
            project={project}
          />
        )}
      </div>
    </div>
  );
}

const JobDropDownItem = function JobDropDownItem({
  currentBranchName,
  project,
  job,
}: {
  currentBranchName: string;
  project: Project;
  job: Job;
}) {
  // Debug logging
  // if (process.env.NODE_ENV === "development") {
  //   console.groupCollapsed("<JobDropDownItem>");
  //   console.log("project:", project);
  //   console.log("currentBranchName:", currentBranchName);
  //   console.log("job:", job);
  //   console.log("actions:", actions);
  //   console.log("count:", count);
  //   console.groupEnd();
  // }

  return (
    <Link
      className="h-full w-full"
      href={`/project/${project.short}/?branch=${currentBranchName}&job=${job.id}`}
    >
      <div className="flex justify-between w-full">
        <div
          className={classNames(
            "truncate pr-4",
            job.num_snapshots_changed === 0 && "text-slate-400"
          )}
        >
          {relativeTime(job.created_at)}
        </div>
        {job.num_snapshots_changed > 0 && (
          <div className="bg-violet-500 px-2 rounded text-white text-xs font-bold flex items-center">
            {job.num_snapshots_changed}
          </div>
        )}
      </div>
    </Link>
  );
};

function BranchDropDownItem({
  branch,
  project,
}: {
  branch: Branch;
  project: Project;
}) {
  let job: Job | null = null;
  try {
    job = mostRecentJobCache.read(branch.id);
  } catch (errorOrThennable) {
    if (isPromiseLike(errorOrThennable)) {
      throw errorOrThennable;
    } else {
      // Ignore branches with no Workflow jobs.
    }
  }

  if (job == null) {
    return (
      <div className="h-full w-full cursor-default">
        <div className="flex justify-between w-full">
          <div className="truncate pr-4 text-slate-400">{branch.name}</div>
        </div>
      </div>
    );
  }

  // Debug logging
  // if (process.env.NODE_ENV === "development") {
  //   console.groupCollapsed("<BranchDropDownItem>");
  //   console.log("job:", job);
  //   console.log("actions:", actions);
  //   console.log("count:", count);
  //   console.groupEnd();
  // }

  return (
    <Link
      className="h-full w-full"
      href={`/project/${project.short}/?branch=${branch.name}`}
    >
      <div className="flex justify-between w-full">
        <div
          className={classNames(
            "truncate pr-4",
            job.num_snapshots_changed === 0 && "text-slate-400"
          )}
        >
          {branch.name}
        </div>
        {job.num_snapshots_changed > 0 && (
          <div className="bg-violet-500 px-2 rounded text-white text-xs font-bold flex items-center">
            {job.num_snapshots_changed}
          </div>
        )}
      </div>
    </Link>
  );
}

// Transform a date into a relative time from now, e.g. 2 days ago
function relativeTime(date) {
  return moment(date).fromNow();
}
