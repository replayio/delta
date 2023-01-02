import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

import useSWR from "swr";
import uniqBy from "lodash/uniqBy";
import sortBy from "lodash/sortBy";
import { Snapshot } from "../../components/Snapshot";
import { SnapshotRow } from "../../components/SnapshotRow";

import { Header } from "../../components/Header";
import { useFetchSnapshots } from "../../hooks/useFetchSnapshots";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export default function Home() {
  const [selectedSnapshotIndex, setSelectedSnapshot] = useState(0);
  const [mode, setMode] = useState("changed");
  const router = useRouter();
  const [branch, setBranch] = useState("main");
  const projectShort = router.query.short;
  console.log("project short", projectShort);

  useEffect(
    () => setBranch(router.query.branch || "main"),
    [router.query.branch]
  );

  const projectQuery = useSWR(
    encodeURI(`/api/getProject?projectShort=${projectShort}`),
    fetcher
  );

  const projectId = projectQuery.data?.id;

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

  const currentAction = useMemo(
    () =>
      sortBy(
        actionsQuery.data,
        (action) => -new Date(action.created_at)
      )?.filter((action) => action.Branches?.name == branch)[0],
    [actionsQuery, branch]
  );

  const { data, error, isLoading } = useFetchSnapshots(branch, projectQuery);

  const { snapshots, newSnapshots, changedSnapshots, unchangedSnapshots } =
    useMemo(() => {
      let snapshots = sortBy(data || [], (snapshot) => snapshot.file);

      const newSnapshots = snapshots.filter(
        (snapshot) => !snapshot.mainSnapshot
      );
      const changedSnapshots = snapshots.filter(
        (snapshot) => snapshot.primary_changed
      );

      const unchangedSnapshots = snapshots.filter(
        (snapshot) => !snapshot.primary_changed
      );

      snapshots =
        mode == "new"
          ? newSnapshots
          : mode == "changed"
          ? changedSnapshots
          : mode == "unchanged"
          ? unchangedSnapshots
          : data;

      return { snapshots, newSnapshots, changedSnapshots, unchangedSnapshots };
    }, [data, mode]);

  const selectedSnapshot = snapshots?.[selectedSnapshotIndex];

  console.log("Selected snapshot", selectedSnapshot);

  return (
    <div className={`h-full overflow-y-hidden`}>
      <Header
        setBranch={setBranch}
        currentAction={currentAction}
        branch={branch}
        projectQuery={projectQuery}
        branches={branches}
      />

      {currentAction?.status == "neutral" ? (
        <div className="flex justify-center items-center mt-10 italic underline text-blue-600">
          <a
            target="_blank"
            rel="noreferrer"
            href={`https://github.com/${projectQuery.data.organization}/${projectQuery.data.repository}/actions/runs/${currentAction?.run_id}`}
          >
            Action in progress...
          </a>
        </div>
      ) : isLoading || actionsQuery.isLoading ? (
        <div className="flex justify-center items-center">loading...</div>
      ) : error || actionsQuery.error ? (
        <div className="flex justify-center items-center">error</div>
      ) : (
        <div className="flex  h-full">
          <div className="flex flex-col">
            <div
              className="flex flex-col h-full overflow-y-scroll overflow-x-hidden"
              style={{ width: "300px" }}
            >
              {snapshots.map((snapshot, index) => (
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
          <div className="flex flex-col flex-grow items-center ">
            {selectedSnapshot && (
              <Snapshot
                key={selectedSnapshot.sha}
                branch={branch}
                project={projectQuery.data}
                snapshot={selectedSnapshot}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
