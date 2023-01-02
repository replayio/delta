import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { ArrowPathIcon } from "@heroicons/react/20/solid";

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

  const projectQuery = useSWR(
    encodeURI(`/api/getProject?projectShort=${projectShort}`),
    fetcher
  );

  const projectId = projectQuery.data?.id;

  const actionsQuery = useSWR(
    projectId
      ? encodeURI(
          projectQuery.isLoading
            ? null
            : `/api/getActions?projectId=${projectId}`
        )
      : null,
    fetcher
  );

  const branches = useMemo(
    () =>
      actionsQuery.data
        ? sortBy(
            uniqBy(
              actionsQuery.data.map((action) => ({
                ...action.Branches,
                num_snapshots: action.num_snapshots,
                num_snapshots_changed: action.num_snapshots_changed,
              })),
              (b) => b.name
            )
          )
        : [],
    [actionsQuery.data]
  );
  const currentAction = useMemo(
    () =>
      sortBy(
        actionsQuery.data,
        (action) => -new Date(action.created_at)
      )?.filter((action) => action.Branches?.name == branch)[0],
    [actionsQuery, branch]
  );

  const shownBranches = useMemo(
    () =>
      branches
        .filter((i) => i.status == "open" && i.num_snapshots_changed > 0)
        .filter((i) => i.name != projectQuery.data.primary_branch),
    [branches, projectQuery]
  );

  useEffect(() => {
    if (router.query.branch) {
      setBranch(router.query.branch);
    } else if (shownBranches.length > 0) {
      setBranch(shownBranches[0].name);
    }
  }, [router.query.branch, shownBranches]);

  const { data, error, isLoading } = useFetchSnapshots(branch, projectQuery);

  const { snapshots, selectedSnapshot, changedSnapshots } = useMemo(() => {
    let snapshots = sortBy(data || [], (snapshot) => snapshot.file);

    const newSnapshots = snapshots.filter((snapshot) => !snapshot.mainSnapshot);
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

    const selectedSnapshot = snapshots?.[selectedSnapshotIndex];
    console.log("snapshots", {
      newSnapshots,
      snapshots,
      changedSnapshots,
      unchangedSnapshots,
      selectedSnapshot,
    });

    return {
      snapshots,
      newSnapshots,
      changedSnapshots,
      unchangedSnapshots,
      selectedSnapshot,
    };
  }, [data, mode, selectedSnapshotIndex]);

  if (error || actionsQuery.error) {
    console.log("error", error, actionsQuery.error);
  }

  return (
    <div className={`h-full overflow-hidden`}>
      <Header
        setBranch={setBranch}
        currentAction={currentAction}
        branch={branch}
        projectQuery={projectQuery}
        changedSnapshots={changedSnapshots}
        shownBranches={shownBranches}
      />

      {!projectId ? (
        <div className="flex justify-center items-center h-full">
          Can&#39;t find project...
        </div>
      ) : currentAction?.status == "neutral" ? (
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
        <div className="flex justify-center items-center mt-10">
          <ArrowPathIcon
            className="text-violet-500 h-5 w-5"
            aria-hidden="true"
          />
        </div>
      ) : error || actionsQuery.error ? (
        <div className="flex justify-center items-center mt-10">Error</div>
      ) : (
        <div className="flex  h-full">
          <div className="flex flex-col">
            <div
              className="flex flex-col h-full overflow-y-auto overflow-x-hidden"
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
          <div className="flex flex-col flex-grow overflow-x-hidden  items-center ">
            {selectedSnapshot && (
              <Snapshot
                key={selectedSnapshot.id}
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
