import useSWR from "swr";
const fetcher = (...args) => fetch(...args).then((res) => res.json());

const Placeholder = () => (
  <div
    className="bg-gray-100 rounded-lg flex items-center justify-center text-gray-500"
    style={{ width: "200px", height: "100px", overflow: "hidden" }}
  >
    Unavailable
  </div>
);

export function Snapshot({ snapshot, project, branch }) {
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
    console.log(
      isLoading,
      mainIsLoading,
      snapshot?.primary_diff_path && diffIsLoading
    );
    return (
      <div className="flex justify-center items-center h-full">loading...</div>
    );
  }

  if (error || mainError || (snapshot?.primary_diff_path && diffError)) {
    return <div className="flex justify-center items-center h-full">error</div>;
  }

  return (
    <div
      className="flex flex-col px-10 mt-4 overflow-y-auto w-full pb-20"
      style={{ minHeight: "300px" }}
    >
      <div className="flex flex-col justify-center">
        <div className=" overflow-y-auto flex items-center flex-col">
          <div>Before</div>
          <SnapshotImage data={mainData} />
        </div>
        <div className=" overflow-y-auto flex items-center flex-col mt-4">
          <div>After</div>
          <SnapshotImage data={data} />
        </div>
      </div>
      <div className="mt-4 flex items-center flex-col p-4">
        <div>Diff</div>
        {snapshot.primary_diff_path ? (
          <SnapshotImage data={diffData} />
        ) : (
          <img
            className=""
            src={encodeURI(
              `/api/snapshot-diff/?projectId=${project?.id}&branch=${branch}&file=${snapshot.file}`
            )}
            alt=""
          />
        )}
      </div>
    </div>
  );
}

function SnapshotImage({ data }) {
  if (!data) {
    return <Placeholder />;
  }
  return <img src={`data:image/png;base64,${data}`} />;
}
