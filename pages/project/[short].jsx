import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

import { Snapshot } from "../../components/Snapshot";
import { SnapshotRow } from "../../components/SnapshotRow";
import { useFetchSnapshots } from "../../hooks/useFetchSnapshots";
import { getSnapshotStatus } from "../../utils/snapshots";
import useSWR from "swr";
import uniqBy from "lodash/uniqBy";
import sortBy from "lodash/sortBy";
import Dropdown from "../../components/Dropdown";
import Image from "next/image";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

const projectId = "dcb5df26-b418-4fe2-9bdf-5a838e604ec4";

export default function Home() {
  const [selectedSnapshotIndex, setSelectedSnapshot] = useState(0);
  const [mode, setMode] = useState();
  const router = useRouter();
  const [branch, setBranch] = useState("main");
  const projectShort = router.query.short;

  useEffect(
    () => setBranch(router.query.branch || "main"),
    [router.query.branch]
  );

  const projectQuery = useSWR(
    encodeURI(`/api/getProject?projectShort=${projectShort}`),
    fetcher
  );

  const actionsQuery = useSWR(
    encodeURI(
      projectQuery.isLoading ? null : `/api/getActions?projectId=${projectId}`
    ),
    fetcher
  );

  console.log("projectQuery", projectQuery?.data);
  console.log("actionsQuery", actionsQuery?.data);

  const branches = useMemo(
    () =>
      actionsQuery.data
        ? sortBy(
            uniqBy(
              actionsQuery.data.map((action) => action.Branches),
              (b) => b.name
            )
          )
        : [],
    [actionsQuery.data]
  );

  const toggleMode = (newMode) => (newMode == mode ? null : setMode(newMode));

  console.log({ actions: actionsQuery.data });
  console.log({ branches });

  return (
    <div className={` h-full`}>
      <div className="flex text-black justify-between border-b-2 mb-1 border-b-slate-100 ">
        <div className="flex items-center py-2 pl-4">
          <div style={{ transform: "rotate(-90deg)" }}>
            <Image width={16} height={16} src="/logo.svg" alt="Replay logo" />
          </div>
          <h1 className="pl-2 text-lg">Delta</h1>
          <div className="ml-1 mr-1"> / </div>
          <Dropdown
            onChange={(val) => setBranch(val)}
            selected={branch}
            project={projectQuery.data}
            options={branches
              .filter((i) => i.status == "open")
              .map((b) => b.name)
              .filter((i) => i !== "main")}
          />
        </div>
        <div className="flex items-center py-2 pr-4">
          {projectQuery.data?.name}
        </div>
      </div>
      <Snapshots
        toggleMode={toggleMode}
        mode={mode}
        actionsQuery={actionsQuery}
        projectQuery={projectQuery}
        branch={branch}
        branches={branches}
        selectedSnapshotIndex={selectedSnapshotIndex}
        setSelectedSnapshot={setSelectedSnapshot}
      />
    </div>
  );
}

function Snapshots({
  toggleMode,
  setSelectedSnapshot,
  selectedSnapshotIndex,
  mode,
  branch,
  branches,
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
          <div onClick={() => toggleMode("new")} className="flex items-center">
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
      <div className="flex  flex-col flex-grow items-center overflow-hidden">
        {selectedSnapshot && <Snapshot snapshot={selectedSnapshot} />}
      </div>
    </div>
  );
}
