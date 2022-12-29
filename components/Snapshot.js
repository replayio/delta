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
    encodeURI(`/api/downloadSnapshot?path=${snapshot?.mainSnapshot?.path}`),
    fetcher
  );

  if (isLoading || mainIsLoading) return <div>loading</div>;
  if (error || mainError) return <div>error</div>;

  return (
    <div className="flex flex-col p-10" style={{ minHeight: "300px" }}>
      <div className="flex mt-4">
        <div className=" overflow-y-auto mr-2 flex items-center flex-col">
          <div>Before</div>
          <img src={`data:image/png;base64,${mainData}`} />
        </div>
        <div className=" overflow-y-auto flex items-center flex-col">
          <div>After</div>
          <img src={`data:image/png;base64,${data}`} />
        </div>
      </div>
    </div>
  );
}
