import { useRouter } from "next/router";
import {
  ComponentType,
  Dispatch,
  PropsWithChildren,
  Suspense,
  createContext,
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { BranchId, ProjectSlug, RunId, SnapshotId } from "../lib/types";
import { branchesCache } from "../suspense/BranchCache";
import { projectCache } from "../suspense/ProjectCache";
import { runsCache } from "../suspense/RunCache";
import { snapshotDiffForRunCache } from "../suspense/SnapshotCache";
import { Loader } from "./Loader";

export type SessionContextState = {
  branchId: BranchId | null;
  projectSlug: ProjectSlug;
  runId: RunId | null;
  snapshotId: SnapshotId | null;
};

export type SessionContextType = {
  branchIdDefault: BranchId | null;
  branchIdDeferred: BranchId | null;
  isBranchPending: boolean;
  isRunPending: boolean;
  isSnapshotPending: boolean;
  projectSlug: ProjectSlug;
  runIdDefault: RunId | null;
  runIdDeferred: RunId | null;
  snapshotIdDefault: SnapshotId | null;
  snapshotIdDeferred: SnapshotId | null;
  transitionBranch: (branchId: BranchId) => void;
  transitionRun: (runId: RunId) => void;
  transitionSnapshot: (snapshotId: SnapshotId) => void;
};

export const SessionContext = createContext<SessionContextType>(null as any);

export default function withSessionContext<Props extends Object>(
  Component: ComponentType<Props>
): ComponentType<Props> {
  function WrappedComponent(props: Props) {
    const router = useRouter();

    let {
      branchId: branchIdFromUrl,
      runId: runIdFromUrl,
      slug: slugFromUrl,
      snapshotId: snapshotIdFromUrl,
    } = router.query as { [key: string]: string };

    if (slugFromUrl == null) {
      throw Error(`Missing Project slug from URL`);
    }

    const [state, setState] = useState<SessionContextState>({
      branchId:
        branchIdFromUrl != null
          ? (parseInt(branchIdFromUrl) as unknown as BranchId)
          : null,
      projectSlug: slugFromUrl as unknown as ProjectSlug,
      runId:
        runIdFromUrl != null
          ? (parseInt(runIdFromUrl) as unknown as RunId)
          : null,
      snapshotId:
        snapshotIdFromUrl != null
          ? (parseInt(snapshotIdFromUrl) as unknown as SnapshotId)
          : null,
    });

    const branchIdDeferred = useDeferredValue(state.branchId);
    const runIdDeferred = useDeferredValue(state.runId);
    const snapshotIdDeferred = useDeferredValue(state.snapshotId);

    const transitionBranch = useCallback((branchId: BranchId) => {
      setState((prevState) => ({
        branchId,
        projectSlug: prevState.projectSlug,
        runId: null,
        snapshotId: null,
      }));
    }, []);

    const transitionRun = useCallback((runId: RunId) => {
      startTransition(() => {
        setState((prevState) => ({
          branchId: prevState.branchId,
          projectSlug: prevState.projectSlug,
          runId,
          snapshotId: null,
        }));
      });
    }, []);

    const transitionSnapshot = useCallback((snapshotId: SnapshotId) => {
      startTransition(() => {
        setState((prevState) => ({
          branchId: prevState.branchId,
          projectSlug: prevState.projectSlug,
          runId: prevState.runId,
          snapshotId,
        }));
      });
    }, []);

    useEffect(() => {
      const params = {
        branchId: state.branchId,
        runId: state.runId,
        snapshotId: state.snapshotId,
      };
      const url = `/project/${state.projectSlug}?${Object.entries(
        params
      ).reduce((string, [key, value]) => {
        if (value != null) {
          string += `${key}=${value}&`;
        }
        return string;
      }, "")}`;
      window.history.pushState("", "", url);
    }, [state]);

    const context = useMemo(
      () => ({
        branchIdDefault: state.branchId,
        branchIdDeferred,
        isBranchPending: branchIdDeferred !== state.branchId,
        isRunPending: runIdDeferred !== state.runId,
        isSnapshotPending: snapshotIdDeferred !== state.snapshotId,
        projectSlug: state.projectSlug,
        runIdDefault: state.runId,
        runIdDeferred,
        snapshotIdDefault: state.snapshotId,
        snapshotIdDeferred,
        transitionBranch,
        transitionRun,
        transitionSnapshot,
      }),
      [
        branchIdDeferred,
        runIdDeferred,
        snapshotIdDeferred,
        state,
        transitionBranch,
        transitionRun,
        transitionSnapshot,
      ]
    );

    return (
      <SessionContext.Provider value={context}>
        <Suspense fallback={<Loader />}>
          <Defaults
            branchId={branchIdDeferred}
            projectSlug={state.projectSlug}
            runId={runIdDeferred}
            setState={setState}
            snapshotId={snapshotIdDeferred}
          >
            <Component {...props} />
          </Defaults>
        </Suspense>
      </SessionContext.Provider>
    );
  }

  // Format for display in DevTools
  const name = Component.displayName || Component.name || "Unknown";
  WrappedComponent.displayName = `withSessionContext(${name})`;

  return WrappedComponent;
}

function Defaults({
  branchId,
  children,
  runId,
  projectSlug,
  setState,
  snapshotId,
}: PropsWithChildren<{
  branchId: BranchId | null;
  projectSlug: ProjectSlug;
  runId: RunId | null;
  setState: Dispatch<SessionContextState>;
  snapshotId: SnapshotId | null;
}>) {
  const project = projectCache.read(projectSlug);

  let newBranchId = branchId;
  if (branchId == null) {
    const branches = branchesCache.read(project.id);
    newBranchId = branches[0].id;
  }

  let newRunId = runId;
  if (runId == null) {
    const runs = runsCache.read(newBranchId!);
    newRunId = runs.length > 0 ? runs[0].id : null;
  }

  let newSnapshotId = snapshotId;
  if (snapshotId == null) {
    const snapshotDiffs = snapshotDiffForRunCache.read(newRunId!);
    if (snapshotDiffs.length > 0) {
      newSnapshotId = snapshotDiffs[0].snapshot.id;
    }
  }

  if (
    branchId !== newBranchId ||
    runId !== newRunId ||
    snapshotId !== newSnapshotId
  ) {
    setState({
      branchId: newBranchId,
      projectSlug,
      runId: newRunId,
      snapshotId: newSnapshotId,
    });
  }

  // Suspend and fetch defaults
  return children as any;
}
