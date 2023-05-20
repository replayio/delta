import { useRouter } from "next/router";
import { Suspense, useState } from "react";
import Icon from "../../../components/Icon";
import { Loader } from "../../../components/Loader";
import SnapshotImage from "../../../components/SnapshotImage";
import withRenderOnMount from "../../../components/withRenderOnMount";
import withSuspenseLoader from "../../../components/withSuspenseLoader";
import { ProjectSlug } from "../../../lib/types";
import { frequentlyUpdatedSnapshotsCache } from "../../../suspense/SnapshotCache";
import classNames from "../../../utils/classNames";
import { SnapshotMetadata } from "../../api/getMostFrequentlyUpdatedSnapshots";

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
    <ul className="list-none p-1 inline-flex flex-col items-start">
      {metadata.map((datum) => (
        <SnapshotListItem key={datum.key} metadata={datum} />
      ))}
    </ul>
  );
}

function SnapshotListItem({ metadata }: { metadata: SnapshotMetadata }) {
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
                {supabasePaths.map((supabasePath) => (
                  <Suspense fallback={<Loader />} key={supabasePath}>
                    <SnapshotImages supabasePath={supabasePath} />
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
}

function SnapshotImages({ supabasePath }: { supabasePath: string }) {
  return (
    <li>
      <SnapshotImage
        className="shrink w-auto max-h-40 rounded border-x border-y border-slate-300"
        path={supabasePath}
      />
    </li>
  );
}
