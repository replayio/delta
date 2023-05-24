import { useRouter } from "next/router";
import { Suspense } from "react";
import Expandable from "../../../components/Expandable";
import Icon from "../../../components/Icon";
import { Loader } from "../../../components/Loader";
import SnapshotImage from "../../../components/SnapshotImage";
import withRenderOnMount from "../../../components/withRenderOnMount";
import withSuspenseLoader from "../../../components/withSuspenseLoader";
import { ProjectSlug } from "../../../lib/types";
import { projectCache } from "../../../suspense/ProjectCache";
import { frequentlyUpdatedSnapshotsCache } from "../../../suspense/SnapshotCache";
import {
  ImageFilenameToSupabasePathMetadata,
  RunMetadata,
  SupabasePathToMetadata,
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
            projectSlug={projectSlug}
            testFilename={testFilename}
            testNameToImageFilenameMetadata={testNameToImageFilenameMetadata}
          />
        )
      )}
    </div>
  );
}

function TestFilenameItem({
  projectSlug,
  testFilename,
  testNameToImageFilenameMetadata,
}: {
  projectSlug: ProjectSlug;
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
                projectSlug={projectSlug}
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
  projectSlug,
  testName,
  imageFilenameToSupabasePathMetadata,
}: {
  projectSlug: ProjectSlug;
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
              projectSlug={projectSlug}
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
  projectSlug,
  supabaseVariantMetadata,
}: {
  imageFilename: string;
  projectSlug: ProjectSlug;
  supabaseVariantMetadata: SupabaseVariantMetadata;
}) {
  return (
    <div className="pl-4">
      <div className="text-sm">{imageFilename}</div>
      <div className="flex flex-col items-start gap-1">
        {Array.from(Object.entries(supabaseVariantMetadata)).map(
          ([variant, supabasePathToMetadata]) => (
            <VariantItem
              key={variant}
              projectSlug={projectSlug}
              variant={variant}
              supabasePathToMetadata={supabasePathToMetadata}
            />
          )
        )}
      </div>
    </div>
  );
}

function VariantItem({
  variant,
  projectSlug,
  supabasePathToMetadata,
}: {
  variant: string;
  projectSlug: ProjectSlug;
  supabasePathToMetadata: SupabasePathToMetadata;
}) {
  return (
    <div className="pl-4">
      <div className="flex flex-row items-start gap-1">
        {Array.from(Object.entries(supabasePathToMetadata)).map(
          ([supabasePath, runMetadata]) => (
            <Suspense fallback={<Loader />} key={supabasePath}>
              <Snapshot
                projectSlug={projectSlug}
                runMetadata={runMetadata}
                supabasePath={supabasePath}
              />
            </Suspense>
          )
        )}
      </div>
    </div>
  );
}

function Snapshot({
  projectSlug,
  runMetadata,
  supabasePath,
}: {
  projectSlug: ProjectSlug;
  runMetadata: RunMetadata[];
  supabasePath: string;
}) {
  const project = projectCache.read(projectSlug);

  return (
    <div>
      <SnapshotImage
        className="shrink w-auto max-h-40 rounded border-x border-y border-slate-300"
        path={supabasePath}
      />
      <div className="flex flex-col items-start gap-1 mt-1">
        {runMetadata.map(({ githubRunId, timestamp }, index) => {
          const date = new Date(timestamp);
          return (
            <a
              className="flex flex-row item-between text-xs w-full gap-1 p-1 bg-yellow-100 hover:bg-yellow-200 rounded"
              href={`https://github.com/${project.organization}/${project.repository}/actions/runs/${githubRunId}`}
              key={index}
              rel="noreferrer"
              target="_blank"
            >
              <div className="truncate grow">
                {date.toLocaleDateString()}, {date.toLocaleTimeString()}
              </div>
              <Icon type="external" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
