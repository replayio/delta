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
import {
  PathMetadata,
  SnapshotMetadata,
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
    <ul className="list-none p-1">
      {metadata.map((datum) => (
        <SnapshotListItem key={datum.file} metadata={datum} />
      ))}
    </ul>
  );
}

function SnapshotListItem({ metadata }: { metadata: SnapshotMetadata }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li>
      <div
        className="mb-1 flex flex-row gap-1 cursor-pointer hover:bg-slate-100"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="bg-violet-500 text-white px-1 py-0.5 text-center rounded">
          <Icon
            className={classNames(
              expanded ? "rotate-90" : "",
              "fill-current h-4 w-4 grow-0 shrink-0 transition-transform"
            )}
            type="expandable-closed"
          />
        </div>
        <div className="text-sm">{metadata.file}</div>
        <div className="bg-slate-200 px-1 py-0.5 text-center rounded text-xs">
          {metadata.count} total
        </div>
        <div className="bg-slate-200 px-1 py-0.5 text-center rounded text-xs">
          {metadata.paths.length} unique
        </div>
      </div>
      {expanded && (
        <ul className="list-none p-1 bg-slate-100 flex flex-col gap-1">
          {metadata.paths.map((path) => (
            <Suspense fallback={<Loader />} key={path.path}>
              <SnapshotImages path={path} />
            </Suspense>
          ))}
        </ul>
      )}
    </li>
  );
}

function SnapshotImages({ path }: { path: PathMetadata }) {
  return (
    <li className="flex flex-row gap-1 items-center">
      <SnapshotImage className="shrink min-w-0" path={path.path} />
    </li>
  );
}
