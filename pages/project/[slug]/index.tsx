import Image from "next/image";
import { useRouter } from "next/router";
import { Fragment, useMemo } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Header } from "../../../components/Header";
import Icon from "../../../components/Icon";
import { Snapshot } from "../../../components/Snapshot";
import { SnapshotRow } from "../../../components/SnapshotRow";
import useSnapshotPrefetchedData from "../../../lib/hooks/useSnapshotPrefetchedData";
import {
  BranchId,
  GithubRunId,
  Project,
  ProjectSlug,
  Run,
  RunId,
} from "../../../lib/types";

import withRenderOnMount from "../../../components/withRenderOnMount";
import withSuspenseLoader from "../../../components/withSuspenseLoader";
import { SnapshotDiff } from "../../../lib/server/types";
import { branchCache, branchesCache } from "../../../suspense/BranchCache";
import { projectCache } from "../../../suspense/ProjectCache";
import { runsCache } from "../../../suspense/RunCache";
import { snapshotDiffForRunCache } from "../../../suspense/SnapshotCache";
import Expandable from "../../../components/Expandable";

export default withRenderOnMount(withSuspenseLoader(Page));

function Page() {
  const router = useRouter();
  const {
    branchId: branchIdFromUrl,
    fileName: currentSnapshotId,
    runId: runIdFromUrl,
    slug: slugFromUrl,
  } = router.query as { [key: string]: string };

  let branchId = parseInt(branchIdFromUrl) as unknown as BranchId;
  const projectSlug = slugFromUrl as unknown as ProjectSlug;
  let runId = parseInt(runIdFromUrl) as unknown as RunId;

  const project = projectCache.read(projectSlug);
  const branches = branchesCache.read(project.id);

  if (!branchId) {
    branchId = branches?.[0]?.id ?? null;
  }

  if (!branchId) {
    return <SubViewNoOpenBranches />;
  }

  const currentBranch = branchCache.read(project.id, branchId);
  const runs = runsCache.read(currentBranch.id) ?? [];

  if (!runId) {
    runId = runs[0]?.id;
  }

  const currentRun = runId
    ? runs.find((run) => run.id === runId) ?? null
    : null;

  const snapshotDiffs = currentRun
    ? snapshotDiffForRunCache.read(currentRun.id)
    : [];
  console.log("snapshotDiffs:", snapshotDiffs);

  // Debug logging
  // if (process.env.NODE_ENV === "development") {
  //   console.groupCollapsed("<Page>");
  //   console.log("project:", project);
  //   console.log("branches:", branches);
  //   console.log("current branch:", currentBranch);
  //   console.log("runs:", runs);
  //   console.log("current run:", currentRun);
  //   console.log("snapshotDiffs:", snapshotDiffs);
  //   console.groupEnd();
  // }

  const shownBranches = branches.filter(
    (branch) => branch.name !== project.primary_branch
  );

  const isPending = currentRun?.github_status != "completed";

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header
        branches={shownBranches}
        currentBranch={currentBranch}
        currentRun={currentRun}
        project={project}
        runs={runs}
      />

      {currentRun && isPending ? (
        <SubViewRunPending project={project} runId={currentRun.github_run_id} />
      ) : shownBranches.length == 0 ? (
        <SubViewNoOpenBranches />
      ) : snapshotDiffs?.length == 0 ? (
        <SubViewNoChanges />
      ) : (
        <SubViewLoadedData
          branchId={branchId}
          currentSnapshotId={currentSnapshotId}
          currentRun={currentRun}
          projectSlug={projectSlug}
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
  branchId,
  currentSnapshotId,
  currentRun,
  projectSlug,
  snapshotDiffs,
}: {
  branchId: BranchId;
  currentSnapshotId: string | null;
  currentRun: Run | null;
  projectSlug: ProjectSlug;
  snapshotDiffs: SnapshotDiff[];
}) {
  if (!currentSnapshotId && snapshotDiffs.length > 0) {
    currentSnapshotId = snapshotDiffs[0].snapshot?.id;
  }

  console.log("snapshotDiffs:", snapshotDiffs);
  const index = useMemo(
    () =>
      snapshotDiffs.findIndex(
        (snapshotDiff) => snapshotDiff.snapshot.id === currentSnapshotId
      ),
    [currentSnapshotId, snapshotDiffs]
  );

  useSnapshotPrefetchedData(snapshotDiffs, index);

  // Debug logging
  // if (process.env.NODE_ENV === "development") {
  //   console.groupCollapsed("<SubViewLoadedData>");
  //   console.log("currentSnapshotId:", currentSnapshotId);
  //   console.log("snapshotDiffs:", snapshotDiffs);
  //   console.groupEnd();
  // }

  const snapshotDiffsByTest = useMemo(() => {
    const grouped = {};
    const groupedArray: {
      snapshotDiffs: SnapshotDiff[];
      testFilename: string;
      testName: string;
    }[] = [];
    snapshotDiffs.forEach((snapshotDiff) => {
      const { delta_test_filename: testFilename, delta_test_name: testName } =
        snapshotDiff.snapshot;
      const key = `${testFilename}:${testName}`;
      let group = grouped[key];
      if (group == null) {
        grouped[key] = group = [];
        groupedArray.push({
          snapshotDiffs: group,
          testFilename,
          testName,
        });
      }
      group.push(snapshotDiff);
    });
    return groupedArray;
  }, [snapshotDiffs]);

  const project = projectCache.read(projectSlug);
  const branch = branchCache.read(project.id, branchId);
  const baseUrl = `https://github.com/${branch.organization}/${project.repository}/blob/${branch.name}/${project.test_directory}`;

  return (
    <div className="flex grow overflow-auto">
      <PanelGroup direction="horizontal">
        <Panel minSize={5} maxSize={25} defaultSize={15} order={1}>
          <div className="w-full h-full flex flex-col h-full overflow-y-auto overflow-x-hidden bg-slate-100">
            {snapshotDiffsByTest.map(
              ({ snapshotDiffs, testFilename, testName }) => (
                <Expandable
                  className="p-1 flex flex-row items-center gap-1 border-b border-slate-300 bg-slate-200 "
                  content={
                    <div className="border-b border-slate-300 bg-slate-100 ">
                      {snapshotDiffs.map((snapshotDiff) => (
                        <SnapshotRow
                          branchId={branchId}
                          key={snapshotDiff.snapshot.id}
                          isSelected={
                            snapshotDiff.snapshot.id === currentSnapshotId
                          }
                          projectSlug={projectSlug}
                          runId={currentRun?.id ?? null}
                          snapshotDiff={snapshotDiff}
                        />
                      ))}
                    </div>
                  }
                  header={
                    <>
                      <div className="grow text-xs text-slate-800" dir="ltr">
                        {testName}
                      </div>
                      <a
                        href={`${baseUrl}/${testFilename}`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <Icon className="w-5 h-5 text-violet-500" type="file" />
                      </a>
                    </>
                  }
                  key={testName}
                />
              )
            )}
          </div>
        </Panel>
        <PanelResizeHandle className="w-2 h-full flex items-center justify-center overflow-visible bg-slate-200 text-slate-400">
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
