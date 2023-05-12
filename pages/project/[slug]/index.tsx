import Image from "next/image";
import { useRouter } from "next/router";
import { useMemo } from "react";
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
import { SnapshotDiffWithMetadata } from "../../../lib/client/types";
import { SnapshotDiff } from "../../../lib/server/types";
import { branchCache, branchesCache } from "../../../suspense/BranchCache";
import { projectCache } from "../../../suspense/ProjectCache";
import { runsCache } from "../../../suspense/RunCache";
import { snapshotDiffForRunCache } from "../../../suspense/SnapshotCache";

export default withRenderOnMount(withSuspenseLoader(Page));

function Page() {
  const router = useRouter();
  const {
    branchId: branchIdFromUrl,
    fileName: currentFile,
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
          currentFile={currentFile}
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
  currentFile,
  currentRun,
  projectSlug,
  snapshotDiffs,
}: {
  branchId: BranchId | null;
  currentFile: string | null;
  currentRun: Run | null;
  projectSlug: ProjectSlug;
  snapshotDiffs: SnapshotDiff[];
}) {
  // Sort and group snapshots by file name/theme
  const snapshotDiffsWithMetadata = useMemo<SnapshotDiffWithMetadata[]>(() => {
    return snapshotDiffs
      .map((snapshotDiff) => {
        const filePieces = snapshotDiff.file.split("/");
        const displayName = filePieces
          .pop()!
          .replace(/-/g, " ")
          .replace(".png", "");
        const theme = filePieces.pop()!;

        return {
          ...snapshotDiff,
          metadata: {
            displayName,
            theme,
          },
        };
      })
      .sort((a, b) => {
        if (a.metadata.displayName === b.metadata.displayName) {
          return a.metadata.theme.localeCompare(b.metadata.theme);
        } else {
          return a.metadata.displayName.localeCompare(b.metadata.displayName);
        }
      });
  }, [snapshotDiffs]);

  if (!currentFile && snapshotDiffsWithMetadata.length > 0) {
    currentFile = snapshotDiffsWithMetadata[0].file;
  }

  const index = useMemo(
    () =>
      snapshotDiffsWithMetadata.findIndex(
        (snapshotDiff) => snapshotDiff.file === currentFile
      ),
    [currentFile, snapshotDiffsWithMetadata]
  );

  useSnapshotPrefetchedData(snapshotDiffsWithMetadata, index);

  // Debug logging
  // if (process.env.NODE_ENV === "development") {
  //   console.groupCollapsed("<SubViewLoadedData>");
  //   console.log("currentFile:", currentFile);
  //   console.log("snapshotDiffs:", snapshotDiffs);
  //   console.log("snapshotDiffsWithMetadata:", snapshotDiffsWithMetadata);
  //   console.groupEnd();
  // }

  return (
    <div className="flex grow overflow-auto">
      <PanelGroup direction="horizontal">
        <Panel minSize={5} maxSize={25} defaultSize={15} order={1}>
          <div className="w-full h-full flex flex-col h-full overflow-y-auto overflow-x-hidden bg-slate-100 py-1">
            {snapshotDiffsWithMetadata.map((snapshotDiff) => (
              <SnapshotRow
                branchId={branchId}
                isSelected={snapshotDiff.file === currentFile}
                key={snapshotDiff.file}
                projectSlug={projectSlug}
                runId={currentRun?.id ?? null}
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
              <Snapshot
                key={index}
                snapshotDiff={snapshotDiffsWithMetadata[index]}
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
