import { useAtom } from "jotai";
import {
  ReactNode,
  Suspense,
  unstable_Offscreen as Offscreen,
  useState,
} from "react";
import { ErrorBoundary } from "react-error-boundary";

import { comparisonModeAtom } from "../lib/client/state";
import {
  fetchSnapshotSuspense,
  SnapshotFile,
  SnapshotVariant,
  SnapshotVariant as SnapshotVariantType,
} from "../suspense/SnapshotCache";
import Icon, { IconType } from "./Icon";

import { ImageSlider } from "./ImageSlider";
import { Loader } from "./Loader";
import SnapshotImage from "./SnapshotImage";
import { SnapshotImageSlider } from "./SnapshotSliderImage";
import { Toggle } from "./Toggle";

export function Snapshot({ snapshotFile }: { snapshotFile: SnapshotFile }) {
  const [mode] = useAtom(comparisonModeAtom);

  const [sliderPercentage, setSliderPercentage] = useState(50);

  const pathData =
    snapshotFile.variants.dark?.pathBranchData ||
    snapshotFile.variants.light?.pathBranchData;

  return (
    <div className="flex flex-col items-center grow p-2 gap-2">
      <Toggle />
      {pathData && mode === "slider" && (
        <ImageSlider
          onChange={setSliderPercentage}
          pathData={pathData}
          value={sliderPercentage}
        />
      )}
      <div className="w-full flex flex-col center gap-2 items-stretch">
        {snapshotFile.variants.dark && (
          <SnapshotVariant
            key="dark"
            sliderPercentage={sliderPercentage}
            snapshotVariant={snapshotFile.variants.dark}
          />
        )}
        {snapshotFile.variants.light && (
          <SnapshotVariant
            key="light"
            sliderPercentage={sliderPercentage}
            snapshotVariant={snapshotFile.variants.light}
          />
        )}
      </div>
    </div>
  );
}

function SnapshotVariant({
  sliderPercentage,
  snapshotVariant,
}: {
  sliderPercentage: number;
  snapshotVariant: SnapshotVariantType;
}) {
  const [mode] = useAtom(comparisonModeAtom);

  const { changed, pathBranchData, pathMainData, status } = snapshotVariant;
  if (
    !changed ||
    pathBranchData == null ||
    pathMainData == null ||
    pathBranchData === pathMainData
  ) {
    let header: ReactNode = null;
    let image: ReactNode = null;
    switch (status) {
      case "added":
        header = <div className="font-bold	text-xs text-green-600">Added</div>;
        image = (
          <div className="border-solid border border-green-600">
            <SnapshotImage path={pathBranchData!} />
          </div>
        );
        break;
      case "deleted":
        header = <div className="font-bold	text-xs text-red-600">Deleted</div>;
        image = (
          <div className="border-solid border border-red-600">
            <SnapshotImage path={pathMainData!} />
          </div>
        );
        break;
      case "unchanged":
        header = (
          <div className="font-bold	text-xs text-slate-500">Not changed</div>
        );
        image = (
          <div className="border-solid border border-slate-500">
            <SnapshotImage path={pathBranchData!} />
          </div>
        );
        break;
    }

    return (
      <ErrorBoundary FallbackComponent={Fallback}>
        <Suspense fallback={<Loader />}>
          <div className="flex flex-col overflow-y-auto overflow-x-auto items-center p-2 bg-slate-100 rounded">
            {header}
            {image}
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
            snapshotVariant={snapshotVariant}
          />
        </Offscreen>
        <Offscreen mode={mode == "compare" ? "visible" : "hidden"}>
          <SubViewCompare snapshotVariant={snapshotVariant} />
        </Offscreen>
        <Offscreen mode={mode == "diff" ? "visible" : "hidden"}>
          <SubViewDiff snapshotVariant={snapshotVariant} />
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
  snapshotVariant,
}: {
  snapshotVariant: SnapshotVariantType;
}) {
  const { pathBranchData, pathMainData } = snapshotVariant;

  return (
    <div className="flex flex-row items-start gap-1">
      <ErrorBoundary FallbackComponent={Fallback}>
        <Suspense fallback={<Loader />}>
          <div className="flex flex-col items-center gap-1">
            <div className="font-bold	text-xs text-red-600">Deleted</div>
            <div className="border-solid border border-red-600">
              <SnapshotImage path={pathMainData!} />
            </div>
          </div>
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary FallbackComponent={Fallback}>
        <Suspense fallback={<Loader />}>
          <div className="flex flex-col items-center gap-1">
            <div className="font-bold	text-xs text-green-600">Added</div>
            <div className="border-solid border border-green-600">
              <SnapshotImage path={pathBranchData!} />
            </div>
          </div>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

function NoDiffData({
  snapshotVariant,
}: {
  snapshotVariant: SnapshotVariantType;
}) {
  const { pathBranchData, pathMainData } = snapshotVariant;

  const path = pathBranchData || pathMainData;
  const { height = 0, width = 0 } = path ? fetchSnapshotSuspense(path) : {};

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

function SubViewDiff({
  snapshotVariant,
}: {
  snapshotVariant: SnapshotVariant;
}) {
  const { pathDiffData } = snapshotVariant;
  if (pathDiffData) {
    return (
      <ErrorBoundary FallbackComponent={Fallback}>
        <Suspense fallback={<Loader />}>
          <SnapshotImage path={pathDiffData} />
        </Suspense>
      </ErrorBoundary>
    );
  } else {
    return <NoDiffData snapshotVariant={snapshotVariant} />;
  }
}

function SubViewSlider({
  sliderPercentage,
  snapshotVariant,
}: {
  sliderPercentage: number;
  snapshotVariant: SnapshotVariantType;
}) {
  const { pathBranchData, pathMainData } = snapshotVariant;
  return (
    <ErrorBoundary FallbackComponent={Fallback}>
      <Suspense fallback={<Loader />}>
        <SnapshotImageSlider
          pathBranchData={pathBranchData!}
          pathMainData={pathMainData!}
          percentage={sliderPercentage}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
