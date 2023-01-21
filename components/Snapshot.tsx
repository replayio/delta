import { useAtom } from "jotai";
import { Suspense, unstable_Offscreen as Offscreen } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { comparisonModeAtom } from "../lib/client/state";
import { Branch, Project } from "../lib/server/supabase/supabase";
import { SnapshotFile, SnapshotVariant } from "../suspense/SnapshotCache";

import { ImageSlider } from "./ImageSlider";
import { Loader } from "./Loader";
import SnapshotDiffImage from "./SnapshotDiffImage";
import SnapshotImage from "./SnapshotImage";
import { Toggle } from "./Toggle";

function SnapshotItem({
  branch,
  file,
  mode,
  project,
  snapshotVariant,
}: {
  branch: Branch;
  file: string;
  mode: string;
  project: Project;
  snapshotVariant: SnapshotVariant;
}) {
  return (
    <div className="flex flex-col overflow-y-auto overflow-x-auto items-center p-2 bg-slate-100 rounded">
      <Offscreen mode={mode == "slider" ? "visible" : "hidden"}>
        <ErrorBoundary key="slider" FallbackComponent={Fallback}>
          <Suspense fallback={<Loader />}>
            <ImageSlider
              pathBranchData={snapshotVariant.pathBranchData}
              pathMainData={snapshotVariant.pathMainData}
            />
          </Suspense>
        </ErrorBoundary>
      </Offscreen>

      <Offscreen mode={mode == "slider" ? "hidden" : "visible"}>
        {snapshotVariant.pathDiffData ? (
          <ErrorBoundary key="snapshot" FallbackComponent={Fallback}>
            <Suspense fallback={<Loader />}>
              <SnapshotImage path={snapshotVariant.pathDiffData} />
            </Suspense>
          </ErrorBoundary>
        ) : (
          <ErrorBoundary key="snapshot-diff" FallbackComponent={Fallback}>
            <Suspense fallback={<Loader />}>
              <SnapshotDiffImage
                branch={branch}
                file={file}
                projectId={project?.id}
              />
            </Suspense>
          </ErrorBoundary>
        )}
      </Offscreen>
    </div>
  );
}

export function Snapshot({
  branch,
  project,
  snapshotFile,
}: {
  branch: Branch;
  project: Project;
  snapshotFile: SnapshotFile;
}) {
  const [mode, setMode] = useAtom(comparisonModeAtom);

  // TODO Tri-mode: slider, new, diff
  return (
    <div className="flex flex-col items-center grow p-2 gap-2">
      <Toggle mode={mode} setMode={setMode} />
      <div className="w-full flex flex-col center gap-2 items-stretch">
        {snapshotFile.variants.dark && (
          <SnapshotItem
            branch={branch}
            file={snapshotFile.file}
            key="dark"
            mode={mode}
            project={project}
            snapshotVariant={snapshotFile.variants.dark}
          />
        )}
        {snapshotFile.variants.light && (
          <SnapshotItem
            branch={branch}
            file={snapshotFile.file}
            key="light"
            mode={mode}
            project={project}
            snapshotVariant={snapshotFile.variants.light}
          />
        )}
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
