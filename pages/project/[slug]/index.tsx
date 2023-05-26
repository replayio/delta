import Image from "next/image";
import { Fragment, MouseEvent, useContext, useMemo } from "react";
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
  SnapshotId,
} from "../../../lib/types";

import Expandable from "../../../components/Expandable";
import { Loader } from "../../../components/Loader";
import withSessionContext, {
  SessionContext,
} from "../../../components/SessionContext";
import withRenderOnMount from "../../../components/withRenderOnMount";
import withSuspenseLoader from "../../../components/withSuspenseLoader";
import { SnapshotDiff } from "../../../lib/server/types";
import { branchCache, branchesCache } from "../../../suspense/BranchCache";
import { projectCache } from "../../../suspense/ProjectCache";
import { runsCache } from "../../../suspense/RunCache";
import { snapshotDiffForRunCache } from "../../../suspense/SnapshotCache";

export default withRenderOnMount(withSuspenseLoader(withSessionContext(Page)));

function Page() {
  const {
    branchIdDeferred,
    isBranchPending,
    isRunPending,
    projectSlug,
    runIdDeferred,
    snapshotIdDeferred,
  } = useContext(SessionContext);

  const project = projectCache.read(projectSlug);
  const branches = branchesCache
    .read(project.id)
    .filter((branch) => branch.name !== project.primary_branch);

  if (
    branchIdDeferred &&
    branches.findIndex((branch) => branch.id === branchIdDeferred) === -1
  ) {
    const currentBranch = branchCache.read(branchIdDeferred);
    branches.unshift(currentBranch);
  }

  const runs = branchIdDeferred != null ? runsCache.read(branchIdDeferred) : [];
  const run = runs.find((run) => run.id === runIdDeferred);
  const snapshotDiffs =
    runIdDeferred != null ? snapshotDiffForRunCache.read(runIdDeferred) : [];

  const isTransitionPending = isBranchPending || isRunPending;
  const isWorkflowPending = run?.github_status != "completed";

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />

      {isTransitionPending ? (
        <Loader />
      ) : run && isWorkflowPending ? (
        <SubViewRunPending githubRunId={run.github_run_id} project={project} />
      ) : branches.length == 0 ? (
        <SubViewNoOpenBranches />
      ) : snapshotDiffs.length == 0 ? (
        <SubViewNoChanges />
      ) : branchIdDeferred != null && run != null ? (
        <SubViewLoadedData
          branchId={branchIdDeferred}
          currentSnapshotId={snapshotIdDeferred}
          projectSlug={projectSlug}
          snapshotDiffs={snapshotDiffs}
        />
      ) : null}
    </div>
  );
}

function SubViewRunPending({
  githubRunId,
  project,
}: {
  githubRunId: GithubRunId;
  project: Project;
}) {
  return (
    <div className="flex justify-center items-center mt-10 italic underline text-violet-600">
      <a
        target="_blank"
        rel="noreferrer"
        href={`https://github.com/${project.organization}/${project.repository}/actions/runs/${githubRunId}`}
      >
        Workflow running...
      </a>
    </div>
  );
}

type TestNameAndSnapshotDiffs = {
  testName: string;
  snapshotDiffs: SnapshotDiff[];
};
type TestFileAndTestNames = {
  testFilename: string;
  testNameAndSnapshotDiffs: TestNameAndSnapshotDiffs[];
};

function SubViewLoadedData({
  branchId,
  currentSnapshotId,
  projectSlug,
  snapshotDiffs,
}: {
  branchId: BranchId;
  currentSnapshotId: SnapshotId | null;
  projectSlug: ProjectSlug;
  snapshotDiffs: SnapshotDiff[];
}) {
  const index = useMemo(
    () =>
      snapshotDiffs.findIndex(
        (snapshotDiff) => snapshotDiff.snapshot.id === currentSnapshotId
      ),
    [currentSnapshotId, snapshotDiffs]
  );

  useSnapshotPrefetchedData(snapshotDiffs, index);

  // Group tests by test file, and group snapshot diffs by test, sorted by name
  const groupedDiffs = useMemo(() => {
    const grouped: {
      [testFilename: string]: {
        [testName: string]: SnapshotDiff[];
      };
    } = {};

    const returnArray: TestFileAndTestNames[] = [];

    let testNameAndSnapshotDiffs: TestNameAndSnapshotDiffs;
    let testFileAndTestNames: TestFileAndTestNames;

    snapshotDiffs.forEach((snapshotDiff) => {
      const { delta_test_filename: testFilename, delta_test_name: testName } =
        snapshotDiff.snapshot;

      let outer = grouped[testFilename];
      if (outer == null) {
        outer = grouped[testFilename] = {};

        testFileAndTestNames = {
          testFilename,
          testNameAndSnapshotDiffs: [],
        };

        returnArray.push(testFileAndTestNames);
      }

      let inner = outer[testName];
      if (inner == null) {
        inner = outer[testName] = [];

        testNameAndSnapshotDiffs = {
          snapshotDiffs: [],
          testName,
        };

        testFileAndTestNames.testNameAndSnapshotDiffs.push(
          testNameAndSnapshotDiffs
        );
      }

      testNameAndSnapshotDiffs.snapshotDiffs.push(snapshotDiff);
    });

    return returnArray;
  }, [snapshotDiffs]);

  // Debug logging
  // if (process.env.NODE_ENV === "development") {
  //   console.groupCollapsed("<SubViewLoadedData>");
  //   console.log("currentSnapshotId:", currentSnapshotId);
  //   console.log("snapshotDiffs:", snapshotDiffs);
  //   console.log("groupedDiffs:", groupedDiffs);
  //   console.groupEnd();
  // }

  const project = projectCache.read(projectSlug);
  const branch = branchCache.read(branchId);
  const baseUrl = `https://github.com/${branch.organization}/${project.repository}/blob/${branch.name}/${project.test_directory}`;

  return (
    <div className="flex grow overflow-auto">
      <PanelGroup direction="horizontal">
        <Panel minSize={5} maxSize={25} defaultSize={15} order={1}>
          <div className="w-full h-full flex flex-col h-full overflow-y-auto overflow-x-hidden bg-slate-100">
            {groupedDiffs.map(({ testFilename, testNameAndSnapshotDiffs }) => (
              <Expandable
                className="p-1 flex flex-row items-center gap-1 border-b border-slate-300 bg-slate-200 hover:bg-slate-300"
                content={
                  <div className="border-b border-slate-300 bg-slate-100">
                    {testNameAndSnapshotDiffs.map(
                      ({ snapshotDiffs, testName }) => (
                        <Fragment key={testName}>
                          <div
                            className="text-xs pr-2 pl-6 truncate text-left bg-slate-100"
                            dir="rtl"
                            title={testName}
                          >
                            {testName}
                          </div>
                          <div className="bg-white">
                            {snapshotDiffs.map((snapshotDiff) => (
                              <SnapshotRow
                                key={snapshotDiff.snapshot.id}
                                snapshotDiff={snapshotDiff}
                              />
                            ))}
                          </div>
                        </Fragment>
                      )
                    )}
                  </div>
                }
                defaultOpen={true}
                header={
                  <>
                    <div
                      className="text-xs text-slate-800 truncate text-left grow shrink"
                      dir="rtl"
                      title={testFilename}
                    >
                      {testFilename}
                    </div>
                    <a
                      href={`${baseUrl}/${testFilename}`}
                      onClick={stopPropagation}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <Icon className="w-5 h-5 text-violet-500" type="file" />
                    </a>
                  </>
                }
                key={testFilename}
              />
            ))}
          </div>
        </Panel>
        <PanelResizeHandle className="w-2 h-full flex items-center justify-center overflow-visible bg-slate-300 text-slate-400">
          <Icon type="drag-handle" />
        </PanelResizeHandle>
        <Panel order={2}>
          <div className="w-full h-full flex flex-col flex-grow overflow-y-auto overflow-x-hidden items-center">
            {index >= 0 && (
              <Snapshot
                key={index}
                project={project}
                snapshotDiff={snapshotDiffs[index]}
              />
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

function stopPropagation(event: MouseEvent) {
  event.stopPropagation();
}
