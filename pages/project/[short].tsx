import Image from "next/image";
import { useRouter } from "next/router";
import { Suspense, useMemo } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Header } from "../../components/Header";
import Icon from "../../components/Icon";
import { Loader } from "../../components/Loader";
import { Snapshot } from "../../components/Snapshot";
import { SnapshotRow } from "../../components/SnapshotRow";
import useSnapshotPrefetchedData from "../../lib/hooks/useSnapshotPrefetchedData";
import { Action, Branch, Project } from "../../lib/server/supabase/supabase";

import { fetchActionsSuspense } from "../../suspense/ActionCache";
import {
  fetchBranchesSuspense,
  fetchBranchSuspense,
} from "../../suspense/BranchCache";
import { fetchProjectSuspense } from "../../suspense/ProjectCache";
import {
  fetchSnapshotFilesSuspense,
  SnapshotFile,
} from "../../suspense/SnapshotCache";

export default function Short() {
  const router = useRouter();
  const {
    action: actionIdFromUrl,
    branch: branchName,
    fileName: currentFileName,
    short: shortProjectId,
  } = router.query as { [key: string]: string };

  // Note this route may render on the server, in which case all query params are undefined.
  // TODO Can we access these params on the server somehow so we can server-render the page?
  if (!shortProjectId) {
    console.error("No project id in URL");
    return null;
  }

  return (
    <Suspense fallback={<Loader />}>
      <ShortSuspends
        actionId={actionIdFromUrl ?? null}
        branchName={branchName ?? null}
        currentFileName={currentFileName ?? null}
        shortProjectId={shortProjectId}
      />
    </Suspense>
  );
}

function ShortSuspends({
  actionId,
  branchName,
  currentFileName,
  shortProjectId,
}: {
  actionId: string | null;
  branchName: string | null;
  currentFileName: string | null;
  shortProjectId: string;
}) {
  // TODO If we passed branch id instead of name, we wouldn't need to fetch the branch here.
  const project = fetchProjectSuspense(null, shortProjectId as string);
  const branches = fetchBranchesSuspense(project.id);

  if (!branchName) {
    branchName = branches?.[0]?.name ?? null;
  }

  const currentBranch = branchName
    ? fetchBranchSuspense(branchName as string)
    : null;
  const actions = currentBranch ? fetchActionsSuspense(currentBranch.id) : null;

  if (!actionId) {
    actionId = actions?.[0]?.id ?? null;
  }

  const currentAction = actionId
    ? actions?.find((action) => action.id === actionId) ?? null
    : null;

  const snapshotFiles = currentAction
    ? fetchSnapshotFilesSuspense(project.id, currentAction.id)
    : null;

  // Debug logging
  // if (process.env.NODE_ENV === "development") {
  //   console.groupCollapsed("<ShortSuspends>");
  //   console.log("project:", project);
  //   console.log("branches:", branches);
  //   console.log("current branch:", currentBranch);
  //   console.log("actions:", actions);
  //   console.log("current action:", currentAction);
  //   console.log("snapshotFiles:", snapshotFiles);
  //   console.groupEnd();
  // }

  return (
    <ShortWithData
      actions={actions}
      branches={branches}
      currentAction={currentAction}
      currentBranch={currentBranch}
      currentFileName={currentFileName}
      project={project}
      snapshotFiles={snapshotFiles}
    />
  );
}

function ShortWithData({
  actions,
  branches,
  currentAction,
  currentBranch,
  currentFileName,
  project,
  snapshotFiles,
}: {
  actions: Action[] | null;
  branches: Branch[];
  currentAction: Action | null;
  currentBranch: Branch | null;
  currentFileName: string | null;
  project: Project;
  snapshotFiles: SnapshotFile[] | null;
}) {
  // TODO Render branches without changes dim (or not at all?)
  const shownBranches = branches;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header
        actions={actions}
        branches={shownBranches}
        currentAction={currentAction}
        currentBranch={currentBranch}
        project={project}
      />

      {currentAction?.status == "neutral" ? (
        <SubViewActionPending currentAction={currentAction} project={project} />
      ) : shownBranches.length == 0 ? (
        <SubViewNoOpenBranches />
      ) : snapshotFiles === null || snapshotFiles.length == 0 ? (
        <SubViewNoChanges />
      ) : (
        <SubViewLoadedData
          currentAction={currentAction}
          currentFileName={currentFileName}
          snapshotFiles={snapshotFiles}
        />
      )}
    </div>
  );
}

function SubViewActionPending({
  currentAction,
  project,
}: {
  currentAction: Action;
  project: Project;
}) {
  return (
    <div className="flex justify-center items-center mt-10 italic underline text-violet-600">
      <a
        target="_blank"
        rel="noreferrer"
        href={`https://github.com/${project.organization}/${project.repository}/actions/runs/${currentAction.run_id}`}
      >
        Action running...
      </a>
    </div>
  );
}

function SubViewLoadedData({
  currentAction,
  currentFileName,
  snapshotFiles,
}: {
  currentAction: Action | null;
  currentFileName: string | null;
  snapshotFiles: SnapshotFile[];
}) {
  const filteredSnapshotFiles = useMemo(
    () =>
      snapshotFiles.filter(
        (snapshotFile) =>
          snapshotFile.variants.dark?.changed ||
          snapshotFile.variants.light?.changed
      ),
    [snapshotFiles]
  );

  if (!currentFileName && filteredSnapshotFiles.length > 0) {
    currentFileName = filteredSnapshotFiles[0].fileName;
  }

  const [currentSnapshotFile, snapshotFileIndex] = useMemo(() => {
    let currentSnapshotFile: SnapshotFile | null = null;
    let index = -1;
    if (currentFileName != null) {
      index = filteredSnapshotFiles.findIndex(
        (snapshotFile) => snapshotFile.fileName === currentFileName
      );
      if (index >= 0) {
        currentSnapshotFile = filteredSnapshotFiles[index];
      }
    }
    return [currentSnapshotFile, index];
  }, [filteredSnapshotFiles, currentFileName]);

  useSnapshotPrefetchedData(filteredSnapshotFiles, snapshotFileIndex);

  // Debug logging
  // if (process.env.NODE_ENV === "development") {
  //   console.groupCollapsed("<SubViewLoadedData>");
  //   console.log("currentFileName:", currentFileName);
  //   console.log("filteredSnapshotFiles:", filteredSnapshotFiles);
  //   console.groupEnd();
  // }

  return (
    <div className="flex grow overflow-auto">
      <PanelGroup direction="horizontal">
        <Panel minSize={5} maxSize={25} defaultSize={15} order={1}>
          <div className="w-full h-full flex flex-col h-full overflow-y-auto overflow-x-hidden bg-slate-100 py-1">
            {filteredSnapshotFiles.map((snapshotFile) => (
              <SnapshotRow
                currentAction={currentAction}
                isSelected={snapshotFile.fileName === currentFileName}
                key={snapshotFile.fileName}
                snapshotFile={snapshotFile}
              />
            ))}
          </div>
        </Panel>
        <PanelResizeHandle className="w-2 h-full flex items-center justify-center overflow-visible bg-slate-100 text-slate-400">
          <Icon type="drag-handle" />
        </PanelResizeHandle>
        <Panel order={2}>
          <div className="w-full h-full flex flex-col flex-grow overflow-y-auto overflow-x-hidden items-center">
            {currentSnapshotFile && (
              <Snapshot
                key={currentSnapshotFile.fileName}
                snapshotFile={currentSnapshotFile}
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
