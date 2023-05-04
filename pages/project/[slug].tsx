import Image from "next/image";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Header } from "../../components/Header";
import Icon from "../../components/Icon";
import { Snapshot } from "../../components/Snapshot";
import { SnapshotRow } from "../../components/SnapshotRow";
import useSnapshotPrefetchedData from "../../lib/hooks/useSnapshotPrefetchedData";
import {
  Branch,
  BranchId,
  GithubRunId,
  Project,
  ProjectSlug,
  PullRequest,
  Run,
  RunId,
} from "../../lib/types";

import withSuspenseLoader from "../../components/withSuspenseLoader";
import { SnapshotDiff } from "../../lib/server/types";
import { branchCache, branchesCache } from "../../suspense/BranchCache";
import { projectCache } from "../../suspense/ProjectCache";
import { pullRequestForRunCache } from "../../suspense/PullRequestsCache";
import { runsCache } from "../../suspense/RunCache";
import { snapshotDiffForRunCache } from "../../suspense/SnapshotCache";

export default function Short() {
  const router = useRouter();
  const {
    run: runIdFromUrl,
    branch: branchIdString,
    fileName: currentFile,
    slug: projectSlug,
  } = router.query as { [key: string]: string };

  // Note this route may render on the server, in which case all query params are undefined.
  // TODO Can we access these params on the server somehow so we can server-render the page?
  if (!projectSlug) {
    console.error("No project id in URL");
    return null;
  }

  const branchId = parseInt(branchIdString) as unknown as BranchId;

  return (
    <ShortSuspends
      branchId={branchId ?? null}
      currentFile={currentFile ?? null}
      runId={(runIdFromUrl as RunId) ?? null}
      projectSlug={projectSlug as ProjectSlug}
    />
  );
}

const ShortSuspends = withSuspenseLoader(function ShortSuspends({
  branchId,
  currentFile,
  runId,
  projectSlug,
}: {
  branchId: BranchId | null;
  currentFile: string | null;
  runId: RunId | null;
  projectSlug: ProjectSlug;
}) {
  // TODO If we passed branch id instead of name, we wouldn't need to fetch the branch here.
  const project = projectCache.read(null, projectSlug);
  const branches = branchesCache.read(project.id);

  if (!branchId) {
    branchId = branches?.[0]?.id ?? null;
  }

  if (!branchId) {
    return null;
  }

  const currentBranch = branchCache.read(branchId);
  const runs = runsCache.read(currentBranch.id);
  if (runs.length === 0) {
    return null;
  }

  if (!runId) {
    runId = runs[0].id;
  }

  const currentRun = runs.find((run) => run.id === runId);
  if (!currentRun) {
    return null;
  }

  const pullRequest = pullRequestForRunCache.read(runId);

  const snapshotDiffs = snapshotDiffForRunCache.read(currentRun.id);

  // Debug logging
  // if (process.env.NODE_ENV === "development") {
  //   console.groupCollapsed("<ShortSuspends>");
  //   console.log("project:", project);
  //   console.log("branches:", branches);
  //   console.log("current branch:", currentBranch);
  //   console.log("runs:", runs);
  //   console.log("current run:", currentRun);
  //   console.log("snapshotFiles:", snapshotFiles);
  //   console.groupEnd();
  // }

  return (
    <ShortWithData
      branches={branches}
      currentBranch={currentBranch}
      currentFile={currentFile}
      currentRun={currentRun}
      project={project}
      pullRequest={pullRequest}
      runs={runs}
      snapshotDiffs={snapshotDiffs}
    />
  );
});

function ShortWithData({
  branches,
  currentBranch,
  currentFile,
  currentRun,
  project,
  pullRequest,
  runs,
  snapshotDiffs,
}: {
  branches: Branch[];
  currentBranch: Branch;
  currentFile: string | null;
  currentRun: Run;
  project: Project;
  pullRequest: PullRequest;
  runs: Run[];
  snapshotDiffs: SnapshotDiff[];
}) {
  const shownBranches = branches.filter(
    (branch) => branch.name !== project.primary_branch
  );

  const isPending = currentRun?.github_status === "queued";

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header
        branches={shownBranches}
        currentBranch={currentBranch}
        currentRun={currentRun}
        project={project}
        pullRequest={pullRequest}
        runs={runs}
      />

      {isPending ? (
        <SubViewRunPending project={project} runId={currentRun.github_run_id} />
      ) : shownBranches.length == 0 ? (
        <SubViewNoOpenBranches />
      ) : snapshotDiffs?.length == 0 ? (
        <SubViewNoChanges />
      ) : (
        <SubViewLoadedData
          currentRun={currentRun}
          currentFile={currentFile}
          snapshotDiffs={snapshotDiffs}
        />
      )}
    </div>
  );
}

function SubViewRunPending({
  project,
  runId,
}: {
  project: Project;
  runId: GithubRunId;
}) {
  return (
    <div className="flex justify-center items-center mt-10 italic underline text-violet-600">
      <a
        target="_blank"
        rel="noreferrer"
        href={`https://github.com/${project.organization}/${project.repository}/actions/runs/${runId}`}
      >
        Workflow running...
      </a>
    </div>
  );
}

function SubViewLoadedData({
  currentRun,
  currentFile,
  snapshotDiffs,
}: {
  currentRun: Run | null;
  currentFile: string | null;
  snapshotDiffs: SnapshotDiff[];
}) {
  if (!currentFile && snapshotDiffs.length > 0) {
    currentFile = snapshotDiffs[0].file;
  }

  const index = useMemo(
    () =>
      snapshotDiffs.findIndex(
        (snapshotDiff) => snapshotDiff.file === currentFile
      ),
    [currentFile, snapshotDiffs]
  );

  useSnapshotPrefetchedData(snapshotDiffs, index);

  // Debug logging
  // if (process.env.NODE_ENV === "development") {
  //   console.groupCollapsed("<SubViewLoadedData>");
  //   console.log("currentFile:", currentFile);
  //   console.log("snapshotDiffs:", snapshotDiffs);
  //   console.groupEnd();
  // }

  return (
    <div className="flex grow overflow-auto">
      <PanelGroup direction="horizontal">
        <Panel minSize={5} maxSize={25} defaultSize={15} order={1}>
          <div className="w-full h-full flex flex-col h-full overflow-y-auto overflow-x-hidden bg-slate-100 py-1">
            {snapshotDiffs.map((snapshotDiff) => (
              <SnapshotRow
                isSelected={snapshotDiff.file === currentFile}
                key={snapshotDiff.file}
                run={currentRun}
                snapshotDiff={snapshotDiff}
              />
            ))}
          </div>
        </Panel>
        <PanelResizeHandle className="w-2 h-full flex items-center justify-center overflow-visible bg-slate-100 text-slate-400">
          <Icon type="drag-handle" />
        </PanelResizeHandle>
        <Panel order={2}>
          <div className="w-full h-full flex flex-col flex-grow overflow-y-auto overflow-x-hidden items-center">
            {index >= 0 && (
              <Snapshot key={index} snapshotDiff={snapshotDiffs[index]} />
            )}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}

function SubViewNoOpenBranches() {
  return (
    <div className="flex justify-center grow text-violet-500 mt-8">
      No open branches with changes...
    </div>
  );
}

function SubViewNoChanges() {
  const randomExpression = useMemo(() => {
    const index = Math.floor(
      (new Date().getMinutes() / 60) * EXPRESSIONS.length
    );
    return EXPRESSIONS[index];
  }, []);

  return (
    <div
      className="flex flex-col pt-32 items-center grow"
      style={{ background: "#BA8BE0" }}
    >
      <Image
        className=""
        width={199}
        height={210}
        src="/robot.png"
        alt="Delta Robot"
      />
      <div className="text-2xl font-light text-violet-50">
        {randomExpression}
      </div>
    </div>
  );
}

const EXPRESSIONS = [
  "Same old, same old.",
  "Nothing new to report.",
  "No changes on the horizon.",
  "Still status quo.",
  "All quiet on the western front.",
  "No surprises here.",
  "Everything's business as usual.",
  "The more things change, the more they stay the same.",
  "No news is good news.",
];
