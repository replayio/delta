import { Suspense, useEffect, useState } from "react";
import useSWR from "swr";
const fetcher = (...args) => fetch(...args).then((res) => res.json());

function SnapshotImage({ snapshot }) {
  const { data, error, isLoading } = useSWR(
    encodeURI(`/api/downloadSnapshot?path=${snapshot?.path}`),
    fetcher
  );

  if (isLoading) return <div>...</div>;

  return <img src={`data:image/png;base64,${data?.image}`} />;
}

export function Snapshot({ snapshot }) {
  const [showOriginal, setShowOriginal] = useState(true);

  useEffect(() => {
    setShowOriginal(true);
  }, [snapshot]);

  const isDifferent = snapshot.mainSnapshot?.sha !== snapshot.sha;
  const isNew = snapshot.mainSnapshot == null;

  return (
    <div
      className="flex flex-col "
      style={{ maxWidth: "600px", minHeight: "300px" }}
    >
      <div className="flex m-4 justify-center">
        {isDifferent && !isNew && (
          <>
            <div
              className={`${
                !showOriginal && "font-bold"
              } cursor-pointer text-black mr-2`}
              onClick={() => setShowOriginal(false)}
            >
              Before
            </div>
            <div
              className={`${
                showOriginal && "font-bold"
              } cursor-pointer text-black`}
              onClick={() => setShowOriginal(true)}
            >
              After
            </div>
          </>
        )}
      </div>
      <div className=" overflow-y-auto">
        <SnapshotImage
          snapshot={showOriginal ? snapshot : snapshot.mainSnapshot}
        />
      </div>
    </div>
  );
}
