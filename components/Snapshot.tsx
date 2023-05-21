import { useAtom } from "jotai";
import { unstable_Offscreen as Offscreen, Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { comparisonModeAtom } from "../lib/client/state";
import { imageDiffCache } from "../suspense/SnapshotCache";
import Icon from "./Icon";

import {
  SnapshotDiff,
  SnapshotVariantDiff,
  SnapshotVariantDiffChanged,
  isSnapshotVariantDiffAdded,
  isSnapshotVariantDiffRemoved,
} from "../lib/server/types";
import { base64ImageCache } from "../suspense/ImageCache";
import { snapshotImageCache } from "../suspense/SnapshotVariantCache";
import ImageSlider from "./ImageSlider";
import { Loader } from "./Loader";
import SnapshotImage from "./SnapshotImage";
import { SnapshotImageSlider } from "./SnapshotSliderImage";

const HTMLImage = "img";

export function Snapshot({ snapshotDiff }: { snapshotDiff: SnapshotDiff }) {
  const [mode] = useAtom(comparisonModeAtom);

  const [sliderPercentage, setSliderPercentage] = useState(50);

  const variants = Object.keys(snapshotDiff.snapshotVariantDiffs);

  return (
    <div className="flex flex-col items-center grow p-2 gap-2">
      {mode === "slider" && (
        <ImageSlider onChange={setSliderPercentage} value={sliderPercentage} />
      )}
      <div className="w-full flex flex-col center gap-2 items-stretch">
        {variants.map((variant) => (
          <SnapshotVariant
            key={variant}
            sliderPercentage={sliderPercentage}
            snapshotVariantDiff={snapshotDiff.snapshotVariantDiffs[variant]}
          />
        ))}
      </div>
    </div>
  );
}

function SnapshotVariant({
  sliderPercentage,
  snapshotVariantDiff,
}: {
  sliderPercentage: number;
  snapshotVariantDiff: SnapshotVariantDiff;
}) {
  const [mode] = useAtom(comparisonModeAtom);

  if (isSnapshotVariantDiffAdded(snapshotVariantDiff)) {
    return (
      <ErrorBoundary FallbackComponent={Fallback}>
        <Suspense fallback={<Loader />}>
          <div className="flex flex-col overflow-y-auto overflow-x-auto items-center p-2 bg-slate-100 rounded">
            <div className="font-bold	text-xs text-green-600">Added</div>
            <div className="border-solid border border-green-600">
              <SnapshotImage path={snapshotVariantDiff.newPath} />
            </div>
          </div>
        </Suspense>
      </ErrorBoundary>
    );
  } else if (isSnapshotVariantDiffRemoved(snapshotVariantDiff)) {
    return (
      <ErrorBoundary FallbackComponent={Fallback}>
        <Suspense fallback={<Loader />}>
          <div className="flex flex-col overflow-y-auto overflow-x-auto items-center p-2 bg-slate-100 rounded">
            <div className="font-bold	text-xs text-red-600">Deleted</div>
            <div className="border-solid border border-red-600">
              <SnapshotImage path={snapshotVariantDiff.oldPath} />
            </div>
          </div>
        </Suspense>
      </ErrorBoundary>
    );
  } else {
    const { newPath, oldPath } = snapshotVariantDiff;
    return (
      <div className="flex flex-col overflow-y-auto overflow-x-auto items-center p-2 bg-slate-100 rounded">
        <Offscreen mode={mode == "slider" ? "visible" : "hidden"}>
          <SubViewSlider
            newPath={newPath}
            oldPath={oldPath}
            sliderPercentage={sliderPercentage}
          />
        </Offscreen>
        <Offscreen mode={mode == "compare" ? "visible" : "hidden"}>
          <SubViewCompare snapshotVariantDiff={snapshotVariantDiff} />
        </Offscreen>
        <Offscreen mode={mode == "diff" ? "visible" : "hidden"}>
          <SubViewDiff snapshotVariantDiff={snapshotVariantDiff} />
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
  snapshotVariantDiff,
}: {
  snapshotVariantDiff: SnapshotVariantDiffChanged;
}) {
  const { newPath, oldPath } = snapshotVariantDiff;

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

function NoDiffData({
  snapshotVariantDiff,
}: {
  snapshotVariantDiff: SnapshotVariantDiffChanged;
}) {
  const { newPath, oldPath } = snapshotVariantDiff;

  const path = newPath || oldPath;
  const { height = 0, width = 0 } = path ? snapshotImageCache.read(path) : {};

  return (
    <div
      className="flex flex-col bg-red-100 text-red-700 rounded items-center justify-center gap-1"
      style={{ minHeight: height, minWidth: width }}
    >
      <div className="text-center w-full whitespace-pre overflow-hidden text-ellipsis shrink-0">
        No diff data found.
      </div>
      <Icon className="fill-current h-6 w-6 shrink-0" type="image-off" />
    </div>
  );
}

function SubViewDiff({
  snapshotVariantDiff,
}: {
  snapshotVariantDiff: SnapshotVariantDiffChanged;
}) {
  const base64String = imageDiffCache.read(
    snapshotVariantDiff.oldPath,
    snapshotVariantDiff.newPath
  );
  if (base64String) {
    const image = base64ImageCache.read(base64String);
    return (
      <ErrorBoundary FallbackComponent={Fallback}>
        <Suspense fallback={<Loader />}>
          <HTMLImage
            alt="Diff"
            src={`data:image/png;base64,${base64String}`}
            width={image.width}
            height={image.height}
          />
        </Suspense>
      </ErrorBoundary>
    );
  } else {
    return <NoDiffData snapshotVariantDiff={snapshotVariantDiff} />;
  }
}

function SubViewSlider({
  newPath,
  oldPath,
  sliderPercentage,
}: {
  newPath: string;
  oldPath: string;
  sliderPercentage: number;
}) {
  return (
    <ErrorBoundary FallbackComponent={Fallback}>
      <Suspense fallback={<Loader />}>
        <SnapshotImageSlider
          newPath={newPath}
          oldPath={oldPath}
          percentage={sliderPercentage}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
