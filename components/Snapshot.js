import { useState } from "react";
import useSWR from "swr";
const fetcher = (...args) => fetch(...args).then((res) => res.json());

export function Snapshot({ snapshot }) {
  const [showOriginal, setShowOriginal] = useState(true);
  const { data, error, isLoading } = useSWR(
    encodeURI(
      `/api/downloadSnapshot?path=${
        showOriginal ? snapshot?.path : snapshot?.mainSnapshot?.path
      }`
    ),
    fetcher
  );
  if (isLoading) return <div>loading...</div>;

  const isDifferent = snapshot.mainSnapshot?.sha !== snapshot.sha;

  return (
    <div style={{ maxWidth: "600px" }}>
      {isDifferent && (
        <div className="flex m-4 justify-center">
          <div
            className={`${!showOriginal && "font-bold"} text-black mr-2`}
            onClick={() => setShowOriginal(false)}
          >
            Before
          </div>
          <div
            className={`${showOriginal && "font-bold"} text-black`}
            onClick={() => setShowOriginal(true)}
          >
            After
          </div>
        </div>
      )}
      {<img src={`data:image/png;base64,${data.image}`} />}
    </div>
  );
}
