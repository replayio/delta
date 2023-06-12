import { useRouter } from "next/router";
import { Suspense } from "react";
import { base64StringToImageSource } from "../../../components/Base64Image";
import Expandable from "../../../components/Expandable";
import Icon from "../../../components/Icon";
import { Loader } from "../../../components/Loader";
import SnapshotImage from "../../../components/SnapshotImage";
import withRenderOnMount from "../../../components/withRenderOnMount";
import withSuspenseLoader from "../../../components/withSuspenseLoader";
import { ProjectSlug } from "../../../lib/types";
import { projectCache } from "../../../suspense/ProjectCache";
import { frequentlyUpdatedSnapshotsCache } from "../../../suspense/SnapshotCache";
import { snapshotImageCache } from "../../../suspense/SnapshotVariantCache";
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

  const showFullImage = async () => {
    const { base64String, height, width } = await snapshotImageCache.readAsync(
      supabasePath
    );

    const tab = window.open("about:blank");
    if (tab) {
      const image = tab.document.createElement("img");
      image.height = height;
      image.src = base64StringToImageSource(base64String);
      image.width = width;

      tab.document.body.style.backgroundColor = "grey";
      tab.document.body.appendChild(image);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="bg-gray-400 rounded">
        <SnapshotImage
          className="w-auto max-h-40 rounded border-x border-y border-slate-300 mx-auto"
          path={supabasePath}
        />
      </div>
      <div className="flex flex-col items-start gap-1 shrink">
        {runMetadata.map(
          ({ githubRunId, replayRecordingId, timestamp }, index) => {
            const date = new Date(timestamp);

            return (
              <div
                className="flex flex-row items-center text-xs w-full gap-1 p-1 pl-2 bg-blue-100 rounded"
                key={index}
              >
                <div className="truncate grow text-blue-600 lowercase">
                  {date.toLocaleDateString()}, {date.toLocaleTimeString()}
                </div>
                <a
                  className="text-blue-600 hover:text-blue-700"
                  href={`https://github.com/${project.organization}/${project.repository}/actions/runs/${githubRunId}`}
                  rel="noreferrer"
                  target="_blank"
                  title="View GitHub run logs"
                >
                  <Icon className="h-4 w-4" type="logs" />
                </a>
                {replayRecordingId && (
                  <a
                    className="text-blue-600 hover:text-blue-700"
                    href={`https://app.replay.io/recording/${replayRecordingId}`}
                    rel="noreferrer"
                    target="_blank"
                    title="View Replay recording"
                  >
                    <Icon className="h-4 w-4" type="play" />
                  </a>
                )}
                <div onClick={showFullImage} title="View full-size image">
                  <Icon
                    className="text-blue-600 hover:text-blue-700 cursor-pointer h-4 w-4"
                    type="inspect"
                  />
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}
