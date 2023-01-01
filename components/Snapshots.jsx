import { Snapshot } from "./Snapshot";
import { SnapshotRow } from "./SnapshotRow";
import { useFetchSnapshots } from "../hooks/useFetchSnapshots";

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

  const newSnapshots = data?.filter((snapshot) => !snapshot.mainSnapshot);
  const changedSnapshots = data?.filter((snapshot) => snapshot.primary_changed);

  const unchangedSnapshots = data?.filter(
    (snapshot) => !snapshot.primary_changed
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

  console.log("Selected snapshot", selectedSnapshot);

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

        <div
          className="flex flex-col h-full overflow-y-scroll overflow-x-hidden"
          style={{ width: "300px" }}
        >
          {snapshots.slice(20, 30).map((snapshot, index) => (
            <SnapshotRow
              key={snapshot.id}
              branch={branch}
              onSelect={setSelectedSnapshot}
              index={index}
              snapshot={snapshot}
              selectedSnapshot={selectedSnapshot}
              project={projectQuery.data}
            />
          ))}
        </div>
      </div>
      <div className="flex  flex-col flex-grow items-center ">
        {selectedSnapshot && (
          <Snapshot
            branch={branch}
            project={projectQuery.data}
            snapshot={selectedSnapshot}
          />
        )}
      </div>
    </div>
  );
}
