import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

import useSWR from "swr";
import uniqBy from "lodash/uniqBy";
import sortBy from "lodash/sortBy";
import { Snapshots } from "../../components/Snapshots";
import { Header } from "../../components/Header";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export default function Home() {
  const [selectedSnapshotIndex, setSelectedSnapshot] = useState(0);
  const [mode, setMode] = useState("changed");
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

  console.log({ actions: actionsQuery.data });
  console.log({ branches });
  const currentAction = useMemo(
    () =>
      sortBy(
        actionsQuery.data,
        (action) => new Date(action.created_at)
      )?.filter((action) => action.Branches?.name == branch)[0],
    [actionsQuery, branch]
  );

  return (
    <div className={` h-full`}>
      <Header
        setBranch={setBranch}
        currentAction={currentAction}
        branch={branch}
        projectQuery={projectQuery}
        branches={branches}
      />

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
