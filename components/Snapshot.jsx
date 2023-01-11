import useSWR from "swr";
import { useState } from "react";
import { useAtom } from "jotai";
import {
  comparisonModeAtom,
  themeAtom,
  themeEnabledAtom,
} from "../lib/client/state";
import { Toggle } from "./Toggle";
import { ImageSlider } from "./ImageSlider";
import { Loader } from "./Loader";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

function SnapshotItem({ snapshot, project, branch }) {
  const [mode, setMode] = useAtom(comparisonModeAtom);
  const { data, error, isLoading } = useSWR(
    encodeURI(`/api/downloadSnapshot?path=${snapshot?.path}`),
    fetcher
  );

  const {
    data: mainData,
    error: mainError,
    isLoading: mainIsLoading,
  } = useSWR(
    snapshot?.mainSnapshot?.path
      ? encodeURI(`/api/downloadSnapshot?path=${snapshot?.mainSnapshot?.path}`)
      : null,
    fetcher
  );

  const {
    data: diffData,
    error: diffError,
    isLoading: diffIsLoading,
  } = useSWR(
    snapshot?.primary_diff_path
      ? encodeURI(`/api/downloadSnapshot?path=${snapshot?.primary_diff_path}`)
      : null,
    fetcher
  );

  const [diffFailed, setDiffFailed] = useState(false);

  if (error || mainError) {
    return <div className="flex justify-center items-center h-full">error</div>;
  }

  return (
    <div
      className="flex flex-col mt-4 overflow-y-auto overflow-x-auto  pb-20  items-center"
      style={{ width: "calc(100% - 20px)" }}
    >
      {error || mainError || diffError || diffFailed ? (
        <div className="flex justify-center items-center h-full text-violet-500 mt-8">
          Could not load...
        </div>
      ) : isLoading || mainIsLoading || diffIsLoading ? (
        <Loader />
      ) : mode == "slider" ? (
        <ImageSlider data={data} mainData={mainData} />
      ) : snapshot.primary_diff_path ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          className="mt-8"
          alt=""
          src={`data:image/png;base64,${diffData}`}
        />
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          className="mt-8"
          fallback="loading"
          placeholder="blur"
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
    <div
      className="flex flex-col mt-4 overflow-y-auto overflow-x-auto  pb-20  items-center"
      style={{ width: "calc(100% - 20px)" }}
    >
      <Toggle mode={mode} setMode={setMode} />
      <div className="w-full flex flex-col">
        {shownSnapshots.map((snapshot) => (
          <SnapshotItem
            key={snapshot.id}
            snapshot={snapshot}
            project={project}
            branch={branch}
          />
        ))}
      </div>
    </div>
  );
}
