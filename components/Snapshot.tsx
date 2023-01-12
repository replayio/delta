import { useAtom } from "jotai";
import { useState } from "react";
import useSWR from "swr";

import {
  comparisonModeAtom,
  themeAtom,
  themeEnabledAtom,
} from "../lib/client/state";
import { fetchJSON } from "../utils/fetchJSON";

import { ImageSlider } from "./ImageSlider";
import { Loader } from "./Loader";
import { Toggle } from "./Toggle";

function SnapshotItem({ branch, mode, project, snapshot }) {
  const { data, error, isLoading } = useSWR(
    encodeURI(`/api/downloadSnapshot?path=${snapshot?.path}`),
    fetchJSON
  );

  const {
    data: mainData,
    error: mainError,
    isLoading: mainIsLoading,
  } = useSWR(
    snapshot?.mainSnapshot?.path
      ? encodeURI(`/api/downloadSnapshot?path=${snapshot?.mainSnapshot?.path}`)
      : null,
    fetchJSON
  );

  const {
    data: diffData,
    error: diffError,
    isLoading: diffIsLoading,
  } = useSWR(
    snapshot?.primary_diff_path
      ? encodeURI(`/api/downloadSnapshot?path=${snapshot?.primary_diff_path}`)
      : null,
    fetchJSON
  );

  const [diffFailed, setDiffFailed] = useState(false);

  if (error || mainError) {
    return <div className="flex justify-center items-center h-full">error</div>;
  }

  return (
    <div className="flex flex-col overflow-y-auto overflow-x-auto items-center p-2 bg-slate-100 rounded">
      {error || mainError || diffError || diffFailed ? (
        <div className="flex justify-center items-center h-full text-violet-500">
          Could not load...
        </div>
      ) : isLoading || mainIsLoading || diffIsLoading ? (
        <Loader />
      ) : mode == "slider" ? (
        <ImageSlider data={data} mainData={mainData} />
      ) : snapshot.primary_diff_path ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img alt="" src={`data:image/png;base64,${diffData}`} />
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          onError={(e) => {
            setDiffFailed(true);
            console.log("cannot show diff", e);
          }}
          src={encodeURI(
            `/api/snapshot-diff/?projectId=${project?.id}&branch=${branch}&file=${snapshot.file}`
          )}
          alt=""
        />
      )}
    </div>
  );
}

export function Snapshot({ selectedSnapshots, project, branch }) {
  const [mode, setMode] = useAtom(comparisonModeAtom);
  const [theme] = useAtom(themeAtom);
  const [themeEnabled] = useAtom(themeEnabledAtom);

  const shownSnapshots = themeEnabled
    ? selectedSnapshots.filter((snapshot) => snapshot.file.includes(theme))
    : selectedSnapshots;

  return (
    <div className="flex flex-col items-center grow p-2 gap-2">
      <Toggle mode={mode} setMode={setMode} />
      <div className="w-full flex flex-col center gap-2 items-stretch">
        {shownSnapshots.map((snapshot) => (
          <SnapshotItem
            key={snapshot.id}
            branch={branch}
            mode={mode}
            project={project}
            snapshot={snapshot}
          />
        ))}
      </div>
    </div>
  );
}
