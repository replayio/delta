import { useImperativeCacheValue } from "suspense";
import { RunId } from "../lib/types";
import { snapshotDiffCountForRunCache } from "../suspense/SnapshotCache";
import withSuspenseLoader from "./withSuspenseLoader";

export const RunCount = withSuspenseLoader(function RunCount({
  runId,
}: {
  runId: RunId;
}) {
  const { value: count } = useImperativeCacheValue(
    snapshotDiffCountForRunCache,
    runId
  );

  if (count === 0) {
    return null;
  }

  return (
    <div className="bg-violet-500 px-2 rounded text-white text-xs font-bold flex items-center">
      {count}
    </div>
  );
});
