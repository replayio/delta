import { useAtom } from "jotai";
import { Suspense, unstable_Offscreen as Offscreen } from "react";
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
import { Toggle } from "./Toggle";

export function Snapshot({ snapshotFile }: { snapshotFile: SnapshotFile }) {
  return (
    <div className="flex flex-col items-center grow p-2 gap-2">
      <Toggle />
      <div className="w-full flex flex-col center gap-2 items-stretch">
        {snapshotFile.variants.dark && (
          <SnapshotVariant
            key="dark"
            snapshotVariant={snapshotFile.variants.dark}
          />
        )}
        {snapshotFile.variants.light && (
          <SnapshotVariant
            key="light"
            snapshotVariant={snapshotFile.variants.light}
          />
        )}
      </div>
    </div>
  );
}

function SnapshotVariant({
  snapshotVariant,
}: {
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
    let header = null;
    switch (status) {
      case "added":
        header = <div className="font-bold	text-xs text-green-600">Added</div>;
        break;
      case "deleted":
        header = <div className="font-bold	text-xs text-red-600">Deleted</div>;
        break;
      case "unchanged":
        header = (
          <div className="font-bold	text-xs text-slate-500">Not changed</div>
        );
        break;
    }

    return (
      <ErrorBoundary FallbackComponent={Fallback}>
        <Suspense fallback={<Loader />}>
          <div className="flex flex-col overflow-y-auto overflow-x-auto items-center p-2 bg-slate-100 rounded">
            {header}
            <div className="border-solid border border-slate-500">
              <SnapshotImage path={pathBranchData} />
            </div>
          </div>
        </Suspense>
      </ErrorBoundary>
    );
  } else {
    return (
      <div className="flex flex-col overflow-y-auto overflow-x-auto items-center p-2 bg-slate-100 rounded">
        <Offscreen mode={mode == "slider" ? "visible" : "hidden"}>
          <SubViewSlider snapshotVariant={snapshotVariant} />
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

function PlaceholderImage({ iconType }: { iconType: IconType }) {
  return (
    <div className="border border-slate-200 p-2 rounded bg-white text-slate-600">
      <Icon type={iconType} />
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
      {pathMainData ? (
        <ErrorBoundary FallbackComponent={Fallback}>
          <Suspense fallback={<Loader />}>
            <div className="flex flex-col items-center gap-1">
              <div className="font-bold	text-xs text-red-600">Deleted</div>
              <div className="border-solid border border-red-600">
                <SnapshotImage path={pathMainData} />
              </div>
            </div>
          </Suspense>
        </ErrorBoundary>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <div className="font-bold	text-xs text-red-600">&nbsp;</div>
          <PlaceholderImage iconType="image" />
        </div>
      )}
      <ErrorBoundary FallbackComponent={Fallback}>
        <Suspense fallback={<Loader />}>
          <div className="flex flex-col items-center gap-1">
            <div className="font-bold	text-xs text-green-600">Added</div>
            <div className="border-solid border border-green-600">
              <SnapshotImage path={pathBranchData} />
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
  const { height, width } = fetchSnapshotSuspense(
    pathBranchData || pathMainData
  );

  return (
    <div
      className="flex flex-col bg-red-100 text-red-700 rounded items-center justify-center gap-1"
      style={{ height, width }}
    >
      <div className="text-center w-full whitespace-pre overflow-hidden text-ellipsis">
        No diff data found.
      </div>
      <Icon className="fill-current h-6 w-6" type="image-off" />
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
  snapshotVariant,
}: {
  snapshotVariant: SnapshotVariantType;
}) {
  const { pathBranchData, pathMainData } = snapshotVariant;
  return (
    <ErrorBoundary FallbackComponent={Fallback}>
      <Suspense fallback={<Loader />}>
        <ImageSlider
          pathBranchData={pathBranchData}
          pathMainData={pathMainData}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
