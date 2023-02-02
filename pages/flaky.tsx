import { useRouter } from "next/router";
import { Suspense, useState } from "react";
import Icon from "../components/Icon";
import { Loader } from "../components/Loader";
import SnapshotImage from "../components/SnapshotImage";
import { fetchFrequentlyUpdatedSnapshotsSuspense } from "../suspense/SnapshotCache";
import classNames from "../utils/classNames";
import {
  PathMetadata,
  SnapshotMetadata,
} from "./api/getMostFrequentlyUpdatedSnapshots";

export default function Flaky() {
  const router = useRouter();
  const { date: afterDate, projectShort } = router.query as {
    [key: string]: string;
  };

  // Note this route may render on the server, in which case all query params are undefined.
  // TODO Can we access these params on the server somehow so we can server-render the page?
  if (!projectShort) {
    console.error("No project id in URL");
    return null;
  }

  return (
    <Suspense fallback={<Loader />}>
      <FlakySuspends
        afterDate={afterDate ?? null}
        projectShort={projectShort}
      />
    </Suspense>
  );
}

function FlakySuspends({
  afterDate,
  projectShort,
}: {
  afterDate: string;
  projectShort: string;
}) {
  const metadata = fetchFrequentlyUpdatedSnapshotsSuspense(
    projectShort,
    afterDate
  );

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
              <Action path={path} />
            </Suspense>
          ))}
        </ul>
      )}
    </li>
  );
}

function Action({ path }: { path: PathMetadata }) {
  return (
    <li className="flex flex-row gap-1 items-center">
      <SnapshotImage className="shrink min-w-0" path={path.path} />
      <SnapshotImage className="shrink min-w-0" path={path.diffPath} />
    </li>
  );
}
