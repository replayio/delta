import useSWR from "swr";
import { useAtom } from "jotai";
import { comparisonModeAtom } from "../lib/client/state";
import { Toggle } from "./Toggle";
import { ImageSlider } from "./ImageSlider";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

const Loader = () => (
  <div className="flex justify-center items-center mt-5">
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-400"></div>
  </div>
);

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
        isLoading || mainIsLoading ? (
          <Loader />
        ) : (
          <ImageSlider data={data} mainData={mainData} />
        )
      ) : (
        <div className="flex items-center flex-col ">
          {snapshot.primary_diff_path ? (
            diffIsLoading ? (
              <Loader />
            ) : (
              <img className="mt-8" src={`data:image/png;base64,${diffData}`} />
            )
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              className="mt-8"
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
