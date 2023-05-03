import { useAtom } from "jotai";
import { unstable_Offscreen as Offscreen, Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { comparisonModeAtom } from "../lib/client/state";
import { imageDiffCache, snapshotCache } from "../suspense/SnapshotCache";
import Icon from "./Icon";

import {
  SnapshotDiff,
  SnapshotDiffChanged,
  isSnapshotDiffAdded,
  isSnapshotDiffRemoved,
} from "../lib/server/types";
import { ImageSlider } from "./ImageSlider";
import { Loader } from "./Loader";
import SnapshotImage from "./SnapshotImage";
import { SnapshotImageSlider } from "./SnapshotSliderImage";

export function Snapshot({ snapshotDiff }: { snapshotDiff: SnapshotDiff }) {
  const [mode] = useAtom(comparisonModeAtom);

  const [sliderPercentage, setSliderPercentage] = useState(50);

  let pathData: string | null = null;
  if (isSnapshotDiffRemoved(snapshotDiff)) {
    pathData = snapshotDiff.oldPath;
  } else {
    pathData = snapshotDiff.newPath;
  }

  return (
    <div className="flex flex-col items-center grow p-2 gap-2">
      {mode === "slider" && (
        <ImageSlider
          onChange={setSliderPercentage}
          pathData={pathData!}
          value={sliderPercentage}
        />
      )}
      <div className="w-full flex flex-col center gap-2 items-stretch">
        <SnapshotVariant
          key="light"
          sliderPercentage={sliderPercentage}
          snapshotDiff={snapshotDiff}
        />
      </div>
    </div>
  );
}

function SnapshotVariant({
  sliderPercentage,
  snapshotDiff,
}: {
  sliderPercentage: number;
  snapshotDiff: SnapshotDiff;
}) {
  const [mode] = useAtom(comparisonModeAtom);

  if (isSnapshotDiffAdded(snapshotDiff)) {
    return (
      <ErrorBoundary FallbackComponent={Fallback}>
        <Suspense fallback={<Loader />}>
          <div className="flex flex-col overflow-y-auto overflow-x-auto items-center p-2 bg-slate-100 rounded">
            <div className="font-bold	text-xs text-green-600">Added</div>
            <div className="border-solid border border-green-600">
              <SnapshotImage path={snapshotDiff.newPath} />
            </div>
          </div>
        </Suspense>
      </ErrorBoundary>
    );
  } else if (isSnapshotDiffRemoved(snapshotDiff)) {
    return (
      <ErrorBoundary FallbackComponent={Fallback}>
        <Suspense fallback={<Loader />}>
          <div className="flex flex-col overflow-y-auto overflow-x-auto items-center p-2 bg-slate-100 rounded">
            <div className="font-bold	text-xs text-red-600">Deleted</div>
            <div className="border-solid border border-red-600">
              <SnapshotImage path={snapshotDiff.oldPath} />
            </div>
          </div>
        </Suspense>
      </ErrorBoundary>
    );
  } else {
    return (
      <div className="flex flex-col overflow-y-auto overflow-x-auto items-center p-2 bg-slate-100 rounded">
        <Offscreen mode={mode == "slider" ? "visible" : "hidden"}>
          <SubViewSlider
            sliderPercentage={sliderPercentage}
            snapshotDiff={snapshotDiff}
          />
        </Offscreen>
        <Offscreen mode={mode == "compare" ? "visible" : "hidden"}>
          <SubViewCompare snapshotDiff={snapshotDiff} />
        </Offscreen>
        <Offscreen mode={mode == "diff" ? "visible" : "hidden"}>
          <SubViewDiff snapshotDiff={snapshotDiff} />
        </Offscreen>
      </div>
    );
  }
}

function Fallback({ error }) {
  return (
    <div className="flex flex-col bg-red-100 text-red-700 rounded border border-red-200 max-w-sm py-1 px-2 mx-auto">
      <strong className="mb-2 text-lg">Error</strong>
      <pre className="break-all whitespace-pre-wrap max-h-32 overflow-y-auto">
        {error?.message ?? error}
      </pre>
    </div>
  );
}

function SubViewCompare({
  snapshotDiff,
}: {
  snapshotDiff: SnapshotDiffChanged;
}) {
  const { newPath, oldPath } = snapshotDiff;

  return (
    <div className="flex flex-row items-start gap-1">
      <ErrorBoundary FallbackComponent={Fallback}>
        <Suspense fallback={<Loader />}>
          <div className="flex flex-col items-center gap-1">
            <div className="font-bold	text-xs text-red-600">Deleted</div>
            <div className="border-solid border border-red-600">
              <SnapshotImage path={oldPath!} />
            </div>
          </div>
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary FallbackComponent={Fallback}>
        <Suspense fallback={<Loader />}>
          <div className="flex flex-col items-center gap-1">
            <div className="font-bold	text-xs text-green-600">Added</div>
            <div className="border-solid border border-green-600">
              <SnapshotImage path={newPath!} />
            </div>
          </div>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

function NoDiffData({ snapshotDiff }: { snapshotDiff: SnapshotDiffChanged }) {
  const { newPath, oldPath } = snapshotDiff;

  const path = newPath || oldPath;
  const { height = 0, width = 0 } = path ? snapshotCache.read(path) : {};

  return (
    <div
      className="flex flex-col bg-red-100 text-red-700 rounded items-center justify-center gap-1"
      style={{ minHeight: height, width }}
    >
      <div className="text-center w-full whitespace-pre overflow-hidden text-ellipsis shrink-0">
        No diff data found.
      </div>
      <Icon className="fill-current h-6 w-6 shrink-0" type="image-off" />
    </div>
  );
}

function SubViewDiff({ snapshotDiff }: { snapshotDiff: SnapshotDiffChanged }) {
  const base64String = imageDiffCache.read(
    snapshotDiff.oldPath,
    snapshotDiff.newPath
  );
  if (base64String) {
    return (
      <ErrorBoundary FallbackComponent={Fallback}>
        <Suspense fallback={<Loader />}>
          <SnapshotImage path={base64String} />
        </Suspense>
      </ErrorBoundary>
    );
  } else {
    return <NoDiffData snapshotDiff={snapshotDiff} />;
  }
}

function SubViewSlider({
  sliderPercentage,
  snapshotDiff,
}: {
  sliderPercentage: number;
  snapshotDiff: SnapshotDiffChanged;
}) {
  const { newPath, oldPath } = snapshotDiff;
  return (
    <ErrorBoundary FallbackComponent={Fallback}>
      <Suspense fallback={<Loader />}>
        {/*<SnapshotImageSlider
          pathBranchData={pathBranchData!}
          oldPath={oldPath!}
          percentage={sliderPercentage}
  />*/}
      </Suspense>
    </ErrorBoundary>
  );
}
