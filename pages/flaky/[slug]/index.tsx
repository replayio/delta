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
    <>
      <div className="text-sm">{testName}</div>
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
    </>
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
    <>
      <div className="text-xs">{imageFilename}</div>
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
    </>
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
    <>
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
    </>
  );
}

{
  /* function SnapshotListItem({ metadata }: { metadata: ResponseData }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li
      className="inline-flex flex-col items-start"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="m-1 inline-flex flex-row gap-1">
        <div className="bg-violet-500 text-white px-1 py-0.5 text-center rounded">
          <Icon
            className={classNames(
              expanded ? "rotate-90" : "",
              "fill-current h-4 w-4 grow-0 shrink-0 transition-transform"
            )}
            type="expandable-closed"
          />
        </div>
        <div className="bg-slate-200 px-1 py-0.5 text-center rounded text-xs">
          {metadata.testFileName}
        </div>
        <div className="text-sm">{metadata.imageFileName}</div>
        <div className="bg-slate-200 px-1 py-0.5 text-center rounded text-xs">
          {metadata.imageCount} snapshots
        </div>
      </div>
      {expanded && (
        <ul className="list-none inline-flex flex-col items-start gap-1">
          {Array.from(Object.entries(metadata.variantsToSupabasePaths)).map(
            ([variant, supabasePaths]) => (
              <ul
                className="inline-flex flex-row gap-1 items-center bg-slate-100 rounded p-1"
                key={variant}
              >
                {supabasePaths.map(({ count, supabasePath }) => (
                  <Suspense fallback={<Loader />} key={supabasePath}>
                    <li>
                      <div>{count}</div>
                      <SnapshotImage
                        className="shrink w-auto max-h-40 rounded border-x border-y border-slate-300"
                        path={supabasePath}
                      />
                    </li>
                  </Suspense>
                ))}
                <li className="px-1 py-0.5 text-center rounded text-xs h-full">
                  {variant}
                </li>
              </ul>
            )
          )}
        </ul>
      )}
    </li>
  );
} */
}
