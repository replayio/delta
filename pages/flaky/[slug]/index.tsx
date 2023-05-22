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
  SupabasePathToCount,
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
          ([variant, supabasePathToCount]) => (
            <VariantItem
              key={variant}
              variant={variant}
              supabasePathToCount={supabasePathToCount}
            />
          )
        )}
      </div>
    </div>
  );
}

function VariantItem({
  variant,
  supabasePathToCount,
}: {
  variant: string;
  supabasePathToCount: SupabasePathToCount;
}) {
  return (
    <div className="pl-4">
      <div className="flex flex-row items-center">
        {Array.from(Object.entries(supabasePathToCount)).map(
          ([supabasePath, count]) => (
            <Suspense fallback={<Loader />} key={supabasePath}>
              <div className="relative">
                <SnapshotImage
                  className="shrink w-auto max-h-40 rounded border-x border-y border-slate-300"
                  path={supabasePath}
                />
                <div className="bg-yellow-400/75 flex items-center justify-center h-4 w-4 rounded-full text-xs absolute right-2 bottom-2">
                  {count}
                </div>
              </div>
            </Suspense>
          )
        )}
      </div>
    </div>
  );
}
