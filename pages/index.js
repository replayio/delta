import { useEffect, useState } from "react";
import { Snapshot } from "../components/Snapshot";
import { SnapshotRow } from "../components/SnapshotRow";
import { useFetchSnapshots } from "../hooks/useFetchSnapshots";
import { getSnapshotStatus } from "../utils/snapshots";

const branch = "visuals";

export default function Home() {
  const [selectedSnapshotIndex, setSelectedSnapshot] = useState(0);
  const [theme, setTheme] = useState("light");
  const [mode, setMode] = useState();

  const { data, error, isLoading } = useFetchSnapshots(branch);

  if (isLoading) return <div>loading...</div>;
  if (error) return <div>error</div>;
  console.log({ selectedSnapshot });

  const newSnapshots = data?.filter(
    (snapshot) => getSnapshotStatus(snapshot) === "new"
  );
  const changedSnapshots = data?.filter(
    (snapshot) => getSnapshotStatus(snapshot) === "different"
  );

  const unchangedSnapshots = data?.filter(
    (snapshot) => getSnapshotStatus(snapshot) === "same"
  );

  const toggleMode = (newMode) => (newMode == mode ? null : setMode(newMode));

  const snapshots =
    mode == "new"
      ? newSnapshots
      : mode == "changed"
      ? changedSnapshots
      : mode == "unchanged"
      ? unchangedSnapshots
      : data;

  const selectedSnapshot = snapshots?.[selectedSnapshotIndex];
  return (
    <div
      className={`${theme == "dark" ? "bg-slate-900" : "bg-white"} h-full p-4`}
    >
      <div className="flex text-black justify-between border-b-2 mb-1 border-b-slate-100 ">
        <div className="flex">
          <h1 className="text-lg">Visuals</h1>
          <div className="ml-1 mr-1"> / </div>
          <div className="bolder text-lg">visuals</div>
        </div>
        {/* <div onClick={() => setTheme(theme == "dark" ? "light" : "dark")}>
          {theme == "dark" ? "dark" : "light"}
        </div> */}
      </div>
      <div className="flex h-full overflow-hidden">
        <div className="flex flex-col">
          <div className="flex flex-col mb-4">
            <div
              onClick={() => toggleMode("new")}
              className="flex items-center"
            >
              <div className="bg-green-500 w-2 h-2 mr-2 rounded-full"></div>
              {newSnapshots?.length} New Snapshots
            </div>
            <div
              onClick={() => toggleMode("changed")}
              className="flex items-center"
            >
              <div className="bg-red-500 w-2 h-2 mr-2 rounded-full"></div>
              {changedSnapshots?.length} Changed Snapshots
            </div>
            <div
              onClick={() => toggleMode("unchanged")}
              className="flex items-center"
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
        <div className="flex flex-grow justify-center items-center">
          <div className="" style={{ height: "600px" }}>
            {selectedSnapshot && <Snapshot snapshot={selectedSnapshot} />}
          </div>
        </div>
      </div>
    </div>
  );
}
