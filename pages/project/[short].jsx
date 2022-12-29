import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

import useSWR from "swr";
import uniqBy from "lodash/uniqBy";
import sortBy from "lodash/sortBy";
import Dropdown from "../../components/Dropdown";
import Image from "next/image";
import { Snapshots } from "../../components/Snapshots";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

const projectId = "dcb5df26-b418-4fe2-9bdf-5a838e604ec4";

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
