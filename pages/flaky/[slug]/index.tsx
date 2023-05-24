import { useRouter } from "next/router";
import { Suspense } from "react";
import Expandable from "../../../components/Expandable";
import { Loader } from "../../../components/Loader";
import SnapshotImage from "../../../components/SnapshotImage";
import withRenderOnMount from "../../../components/withRenderOnMount";
import withSuspenseLoader from "../../../components/withSuspenseLoader";
import { ProjectSlug } from "../../../lib/types";
import { frequentlyUpdatedSnapshotsCache } from "../../../suspense/SnapshotCache";
import {
  ImageFilenameToSupabasePathMetadata,
  SupabasePathToTimestamps,
  SupabaseVariantMetadata,
  TestNameToImageFilenameMetadata,
} from "../../api/getMostFrequentlyUpdatedSnapshots";

export default withRenderOnMount(withSuspenseLoader(Flaky));

function Flaky() {
  const router = useRouter();
  const { date: afterDate, slug: projectSlug } = router.query as {
    [key: string]: string;
  };

  return (
    <Suspense fallback={<Loader />}>
      <FlakySuspends
        afterDate={afterDate ?? null}
        projectSlug={projectSlug as ProjectSlug}
      />
    </Suspense>
  );
}

function FlakySuspends({
  afterDate,
  projectSlug,
}: {
  afterDate: string;
  projectSlug: ProjectSlug;
}) {
  const metadata = frequentlyUpdatedSnapshotsCache.read(projectSlug, afterDate);

  return (
    <div className="flex flex-col items-start">
      {Array.from(Object.entries(metadata)).map(
        ([testFilename, testNameToImageFilenameMetadata]) => (
          <TestFilenameItem
            key={testFilename}
            testFilename={testFilename}
            testNameToImageFilenameMetadata={testNameToImageFilenameMetadata}
          />
        )
      )}
    </div>
  );
}

function TestFilenameItem({
  testFilename,
  testNameToImageFilenameMetadata,
}: {
  testFilename: string;
  testNameToImageFilenameMetadata: TestNameToImageFilenameMetadata;
}) {
  return (
    <Expandable
      content={
        <div className="pl-6 flex flex-col items-start gap-1">
          {Array.from(Object.entries(testNameToImageFilenameMetadata)).map(
            ([testName, imageFilenameToSupabasePathMetadata]) => (
              <TestNameItem
                key={testName}
                testName={testName}
                imageFilenameToSupabasePathMetadata={
                  imageFilenameToSupabasePathMetadata
                }
              />
            )
          )}
        </div>
      }
      defaultOpen={true}
      header={<div className="px-1 py-0.5">{testFilename}</div>}
    />
  );
}

function TestNameItem({
  testName,
  imageFilenameToSupabasePathMetadata,
}: {
  testName: string;
  imageFilenameToSupabasePathMetadata: ImageFilenameToSupabasePathMetadata;
}) {
  return (
    <div className="pl-4">
      <div className="text-sm">{`it("${testName}")`}</div>
      <div className="flex flex-col items-start gap-1">
        {Array.from(Object.entries(imageFilenameToSupabasePathMetadata)).map(
          ([imageFilename, supabaseVariantMetadata]) => (
            <SupabasePathItem
              imageFilename={imageFilename}
              key={imageFilename}
              supabaseVariantMetadata={supabaseVariantMetadata}
            />
          )
        )}
      </div>
    </div>
  );
}

function SupabasePathItem({
  imageFilename,
  supabaseVariantMetadata,
}: {
  imageFilename: string;
  supabaseVariantMetadata: SupabaseVariantMetadata;
}) {
  return (
    <div className="pl-4">
      <div className="text-sm">{imageFilename}</div>
      <div className="flex flex-col items-start gap-1">
        {Array.from(Object.entries(supabaseVariantMetadata)).map(
          ([variant, supabasePathToTimestamps]) => (
            <VariantItem
              key={variant}
              variant={variant}
              supabasePathToTimestamps={supabasePathToTimestamps}
            />
          )
        )}
      </div>
    </div>
  );
}

function VariantItem({
  variant,
  supabasePathToTimestamps,
}: {
  variant: string;
  supabasePathToTimestamps: SupabasePathToTimestamps;
}) {
  return (
    <div className="pl-4">
      <div className="flex flex-row items-start gap-1">
        {Array.from(Object.entries(supabasePathToTimestamps)).map(
          ([supabasePath, timestamps]) => (
            <Suspense fallback={<Loader />} key={supabasePath}>
              <Snapshot timestamps={timestamps} supabasePath={supabasePath} />
            </Suspense>
          )
        )}
      </div>
    </div>
  );
}

function Snapshot({
  timestamps,
  supabasePath,
}: {
  timestamps: string[];
  supabasePath: string;
}) {
  return (
    <div>
      <SnapshotImage
        className="shrink w-auto max-h-40 rounded border-x border-y border-slate-300"
        path={supabasePath}
      />
      <div className="flex flex-col items-start gap-1 mt-1">
        {timestamps.map((timestamp, index) => {
          const date = new Date(timestamp);
          return (
            <div
              className="flex flex-row item-between text-xs w-full gap-1 p-1 bg-yellow-200 rounded"
              key={index}
            >
              <div className="truncate">{date.toLocaleDateString()}</div>
              <div className="grow"></div>
              <div className="truncate">{date.toLocaleTimeString()}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
