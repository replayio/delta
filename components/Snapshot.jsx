import useSWR from "swr";
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import { useAtom } from "jotai";
import { comparisonModeAtom } from "../lib/client/state";
import { Toggle } from "./Toggle";
import { ImageSlider } from "./ImageSlider";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

const Placeholder = () => (
  <div
    className="bg-gray-100 rounded-lg flex items-center justify-center text-gray-500"
    style={{ width: "200px", height: "100px", overflow: "hidden" }}
  >
    Unavailable
  </div>
);

function SnapshotImage({ data }) {
  if (!data) {
    return <Placeholder />;
  }
  return <img src={`data:image/png;base64,${data}`} />;
}

export function Snapshot({ snapshot, project, branch }) {
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

  if (
    isLoading ||
    mainIsLoading ||
    (snapshot?.primary_diff_path && diffIsLoading)
  ) {
    return (
      <div className="flex justify-center items-center  mt-10">
        <ArrowPathIcon className="text-violet-500 h-5 w-5" aria-hidden="true" />
      </div>
    );
  }

  if (error || mainError || (snapshot?.primary_diff_path && diffError)) {
    return <div className="flex justify-center items-center h-full">error</div>;
  }

  console.log(
    "selected snapshot",
    snapshot.primary_diff_path,
    snapshot.primary_num_pixels,
    snapshot
  );

  return (
    <div
      className="flex flex-col mt-4 overflow-y-auto overflow-x-auto  pb-20  items-center"
      style={{ minHeight: "300px", width: "calc(100% - 20px)" }}
    >
      <Toggle mode={mode} setMode={setMode} />
      {mode == "slider" ? (
        <ImageSlider data={data} mainData={mainData} />
      ) : (
        <div className="mt-8 flex items-center flex-col ">
          {snapshot.primary_diff_path ? (
            <SnapshotImage data={diffData} />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={encodeURI(
                `/api/snapshot-diff/?projectId=${project?.id}&branch=${branch}&file=${snapshot.file}`
              )}
              alt=""
            />
          )}
        </div>
      )}
    </div>
  );
}
