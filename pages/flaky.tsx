import { useRouter } from "next/router";
import { Suspense } from "react";
import { Loader } from "../components/Loader";
import { fetchFrequentlyUpdatedSnapshotsSuspense } from "../suspense/SnapshotCache";

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
  const snapshots = fetchFrequentlyUpdatedSnapshotsSuspense(
    projectShort,
    afterDate
  );

  return <pre>{JSON.stringify(snapshots, null, 2)}</pre>;
}
