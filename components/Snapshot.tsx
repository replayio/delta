import { useAtom } from "jotai";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import {
  comparisonModeAtom,
  themeAtom,
  themeEnabledAtom,
} from "../lib/client/state";

import { ImageSlider } from "./ImageSlider";
import { Loader } from "./Loader";
import SnapshotDiffImage from "./SnapshotDiffImage";
import SnapshotImage from "./SnapshotImage";
import { Toggle } from "./Toggle";

function SnapshotItem({ branch, mode, project, snapshot }) {
  return (
    <div className="flex flex-col overflow-y-auto overflow-x-auto items-center p-2 bg-slate-100 rounded">
      {mode == "slider" ? (
        <ErrorBoundary key="slider" FallbackComponent={Fallback}>
          <Suspense fallback={<Loader />}>
            <ImageSlider snapshot={snapshot} />
          </Suspense>
        </ErrorBoundary>
      ) : snapshot?.primary_diff_path ? (
        <ErrorBoundary key="snapshot" FallbackComponent={Fallback}>
          <Suspense fallback={<Loader />}>
            <SnapshotImage path={snapshot?.primary_diff_path} />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <ErrorBoundary key="snapshot-diff" FallbackComponent={Fallback}>
          <Suspense fallback={<Loader />}>
            <SnapshotDiffImage
              branch={branch}
              file={snapshot?.file}
              projectId={project?.id}
            />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
}

export function Snapshot({ selectedSnapshots, project, branch }) {
  const [mode, setMode] = useAtom(comparisonModeAtom);
  const [theme] = useAtom(themeAtom);
  const [themeEnabled] = useAtom(themeEnabledAtom);

  const shownSnapshots = themeEnabled
    ? selectedSnapshots.filter((snapshot) => snapshot.file.includes(theme))
    : selectedSnapshots;

  return (
    <div className="flex flex-col items-center grow p-2 gap-2">
      <Toggle mode={mode} setMode={setMode} />
      <div className="w-full flex flex-col center gap-2 items-stretch">
        {shownSnapshots.map((snapshot) => (
          <SnapshotItem
            branch={branch}
            key={snapshot.id}
            mode={mode}
            project={project}
            snapshot={snapshot}
          />
        ))}
      </div>
    </div>
  );
}

function Fallback({ error }) {
  return (
    <div className="flex flex-col bg-red-100 text-red-700 rounded border border-red-200 max-w-sm py-1 px-2 mx-auto">
      <strong className="mb-2 text-lg">Error</strong>
      <pre className="break-all whitespace-pre-wrap max-h-32 overflow-y-auto">
        {error.message}
      </pre>
    </div>
  );
}
