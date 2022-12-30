import useSWR from "swr";
const fetcher = (...args) => fetch(...args).then((res) => res.json());

export function Snapshot({ snapshot }) {
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

  if (isLoading || mainIsLoading) return <div>loading</div>;
  if (error || mainError) return <div>error</div>;

  return (
    <div className="flex flex-col p-10" style={{ minHeight: "300px" }}>
      <div className="flex mt-4">
        <div className=" overflow-y-auto mr-2 flex items-center flex-col">
          <div>Before</div>
          {mainData ? (
            <img src={`data:image/png;base64,${mainData}`} />
          ) : (
            <div
              className="bg-gray-100 rounded-lg flex items-center justify-center text-gray-500"
              style={{ width: "200px", height: "100px", overflow: "hidden" }}
            >
              Unavailable
            </div>
          )}
        </div>
        <div className=" overflow-y-auto flex items-center flex-col">
          <div>After</div>
          <img src={`data:image/png;base64,${data}`} />
        </div>
      </div>
    </div>
  );
}
