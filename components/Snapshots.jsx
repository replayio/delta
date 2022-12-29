import { Snapshot } from "./Snapshot";
import { SnapshotRow } from "./SnapshotRow";
import { useFetchSnapshots } from "../hooks/useFetchSnapshots";
import { getSnapshotStatus } from "../utils/snapshots";

export function Snapshots({
  toggleMode,
  setSelectedSnapshot,
  selectedSnapshotIndex,
  mode,
  branch,
  projectQuery,
  actionsQuery,
}) {
  const { data, error, isLoading } = useFetchSnapshots(branch, projectQuery);

  const newSnapshots = data?.filter(
    (snapshot) => getSnapshotStatus(snapshot) === "new"
  );
  const changedSnapshots = data?.filter(
    (snapshot) => getSnapshotStatus(snapshot) === "different"
  );

  const unchangedSnapshots = data?.filter(
    (snapshot) => getSnapshotStatus(snapshot) === "same"
  );

  const snapshots =
    mode == "new"
      ? newSnapshots
      : mode == "changed"
      ? changedSnapshots
      : mode == "unchanged"
      ? unchangedSnapshots
      : data;
  const selectedSnapshot = snapshots?.[selectedSnapshotIndex];

  if (isLoading || actionsQuery.isLoading) return <div>loading...</div>;
  if (error || actionsQuery.error) return <div>error</div>;

  return (
    <div className="flex h-full overflow-hidden pl-4">
      <div className="flex flex-col">
        <div className="flex flex-col mb-4">
          <div
            onClick={() => toggleMode("new")}
            className={`flex cursor-pointer items-center ${
              mode == "new" && "font-bold"
            }`}
          >
            <div className="bg-green-500 w-2 h-2 mr-2 rounded-full"></div>
            {newSnapshots?.length} New Snapshots
          </div>
          <div
            onClick={() => toggleMode("changed")}
            className={`flex cursor-pointer items-center ${
              mode == "changed" && "font-bold"
            } `}
          >
            <div className="bg-red-500 w-2 h-2 mr-2 rounded-full"></div>
            {changedSnapshots?.length} Changed Snapshots
          </div>
          <div
            onClick={() => toggleMode("unchanged")}
            className={`flex cursor-pointer items-center ${
              mode == "unchanged" && "font-bold"
            }`}
          >
            <div className="bg-slate-500 w-2 h-2 mr-2 rounded-full"></div>
            {unchangedSnapshots?.length} Unchanged Snapshots
          </div>
        </div>

        <div className="flex flex-col h-full overflow-y-scroll">
          {snapshots.map((snapshot, index) => (
            <SnapshotRow
              key={snapshot.id}
              onSelect={setSelectedSnapshot}
              index={index}
              snapshot={snapshot}
              selectedSnapshot={selectedSnapshot}
            />
          ))}
        </div>
      </div>
      <div className="flex  flex-col flex-grow items-center overflow-hidden">
        {selectedSnapshot && <Snapshot snapshot={selectedSnapshot} />}
      </div>
    </div>
  );
}
