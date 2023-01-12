import { useAtom } from "jotai";
import uniqBy from "lodash/uniqBy";
import sortBy from "lodash/sortBy";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";
import useSWR from "swr";

import { Snapshot } from "../../components/Snapshot";
import { SnapshotRow } from "../../components/SnapshotRow";
import { Loader } from "../../components/Loader";

import { Header } from "../../components/Header";
import { useFetchSnapshots } from "../../hooks/useFetchSnapshots";
import { snapshotsModeAtom } from "../../lib/client/state";
import { fetchJSON } from "../../utils/fetchJSON";

const getSnapshotFile = (snapshot) => {
  // if (!snapshot) debugger;
  return snapshot.file?.split("/").pop();
};

const listOfExpressions = [
  "Same old, same old.",
  "Nothing new to report.",
  "No changes on the horizon.",
  "Still status quo.",
  "All quiet on the western front.",
  "No surprises here.",
  "Everything's business as usual.",
  "The more things change, the more they stay the same.",
  "No news is good news.",
];

function getExpression() {
  return listOfExpressions[
    Math.floor((new Date().getMinutes() / 60) * listOfExpressions.length)
  ];
}

export default function Home() {
  const router = useRouter();
  const { short, snapshot, branch } = router.query;

  const [mode, setMode] = useAtom(snapshotsModeAtom);
  const projectQuery = useSWR(
    encodeURI(`/api/getProject?projectShort=${short}`),
    fetchJSON
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
    fetchJSON
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
                action_status: action.status,
              })),
              (b) => b.name
            )
          )
        : [],
    [actionsQuery.data]
  );

  const branchActions = useMemo(
    () =>
      sortBy(
        actionsQuery.data,
        (action) => -new Date(action.created_at)
      )?.filter((action) => action.Branches?.name == branch),
    [actionsQuery, branch]
  );
  const currentAction = useMemo(
    () =>
      router.query.action
        ? branchActions.find((branch) => branch.id === router.query.action)
        : branchActions?.[0],
    [branchActions, router.query]
  );

  const shownBranches = useMemo(
    () =>
      branches
        .filter(
          (i) =>
            (i.status == "open" && i.num_snapshots_changed > 0) ||
            i.action_status == "neutral"
        )
        .filter((i) => i.name != projectQuery.data.primary_branch),
    [branches, projectQuery]
  );

  useEffect(() => {
    if (router.query.mode) {
      setMode(router.query.mode);
    }
  }, [router.query.mode, setMode]);

  useEffect(() => {
    const { short, branch, snapshot, action } = router.query;
    const newBranch = shownBranches[0]?.name;
    if (!branch && newBranch) {
      router.push(
        `/project/${short}${newBranch ? `?branch=${newBranch}` : ""}${
          snapshot ? `&snapshot=${snapshot}` : ""
        }${action ? `&action=${currentAction.id}` : ""}`,
        undefined,
        { shallow: true }
      );
    }
  }, [router, shownBranches, currentAction]);

  const { data, error, isLoading } = useFetchSnapshots(
    currentAction,
    projectQuery
  );

  const { snapshots, selectedSnapshot, selectedSnapshots, changedSnapshots } =
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

      const selectedSnapshot = snapshots.find(
        (_snapshot) => _snapshot.id == snapshot
      );

      const selectedSnapshots = snapshots.filter(
        (_snapshot) =>
          selectedSnapshot &&
          getSnapshotFile(_snapshot) == getSnapshotFile(selectedSnapshot)
      );

      console.log("snapshots", {
        newSnapshots,
        snapshots,
        changedSnapshots,
        unchangedSnapshots,
        selectedSnapshot,
        selectedSnapshots,
      });

      return {
        snapshots,
        newSnapshots,
        changedSnapshots,
        unchangedSnapshots,
        selectedSnapshot,
        selectedSnapshots,
      };
    }, [data, mode, snapshot]);

  useEffect(() => {
    const { short, branch, snapshot, action } = router.query;
    if (!snapshot && branch && snapshots.length > 0) {
      router.push(
        `/project/${short}?branch=${branch}&snapshot=${snapshots[0].id}${
          action ? `&action=${action}` : ""
        }`,
        undefined,
        { shallow: true }
      );
    }
  }, [router, snapshots, selectedSnapshot]);

  if (error || actionsQuery.error) {
    console.log("error", error, actionsQuery.error);
  }

  const loading = isLoading || actionsQuery.isLoading || projectQuery.isLoading;

  const actionDuration = useMemo(() => {
    if (currentAction) {
      const actionAge =
        (new Date() - new Date(currentAction.created_at)) / 1000;
      const actionMinutes = Math.floor(actionAge / 60);
      const actionSeconds = Math.floor(actionAge % 60);
      return `${actionMinutes}m ${actionSeconds}s`;
    }
  }, [currentAction]);

  const uniqSnapshots = useMemo(
    () => uniqBy(snapshots, getSnapshotFile),
    [snapshots]
  );

  const lightSnapshots = useMemo(
    () => snapshots.filter((snapshot) => snapshot.file.includes("light")),
    [snapshots]
  );

  const darkSnapshots = useMemo(
    () => snapshots.filter((snapshot) => snapshot.file.includes("dark")),
    [snapshots]
  );

  console.log({
    lightSnapshots,
    darkSnapshots,
    shownBranches,
    currentAction,
    actions: actionsQuery.data,
    branchActions,
  });

  return (
    <div className={`h-full overflow-hidden`}>
      <Header
        currentAction={currentAction}
        branch={branch}
        projectQuery={projectQuery}
        changedSnapshots={changedSnapshots}
        shownBranches={shownBranches}
        branchActions={branchActions}
      />

      {currentAction?.status == "neutral" ? (
        <div className="flex justify-center items-center mt-10 italic underline text-violet-600">
          <a
            target="_blank"
            rel="noreferrer"
            href={`https://github.com/${projectQuery.data.organization}/${projectQuery.data.repository}/actions/runs/${currentAction?.run_id}`}
          >
            Action running...
          </a>
        </div>
      ) : loading ? (
        <Loader />
      ) : shownBranches.length == 0 ? (
        <div className="flex justify-center  h-full text-violet-500 mt-8">
          No open branches with changes...
        </div>
      ) : lightSnapshots.length == 0 && darkSnapshots.length == 0 ? (
        <div
          className="flex flex-col pt-32 items-center h-full"
          style={{ background: "#BA8BE0" }}
        >
          <Image
            className=""
            width={199}
            height={210}
            src="/robot.png"
            alt="Delta Robot"
          />
          <div className="text-2xl font-light text-violet-50">
            {getExpression()}
          </div>
        </div>
      ) : error || actionsQuery.error ? (
        <div className="flex justify-center h-full text-violet-500 mt-8">
          Error
        </div>
      ) : (
        <div className="flex  h-full">
          <div className="flex flex-col">
            <div
              className="flex flex-col h-full overflow-y-auto overflow-x-hidden"
              style={{ width: "300px" }}
            >
              {uniqSnapshots.map((snapshot, index) => (
                <SnapshotRow
                  key={snapshot.id}
                  branch={branch}
                  index={index}
                  snapshot={snapshot}
                  selectedSnapshot={selectedSnapshot}
                  project={projectQuery.data}
                  currentAction={currentAction}
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
                selectedSnapshots={selectedSnapshots}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
