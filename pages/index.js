import Head from "next/head";
import Image from "next/image";
import { useEffect, useState } from "react";
import useSWR from "swr";
const fetcher = (...args) => fetch(...args).then((res) => res.json());

const branch = "test";

function Snapshot({ snapshot }) {
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
      {<img src={`data:image/png;base64,${data.image}`} />}
      {isDifferent && (
        <div className="flex mt-2 justify-center">
          <div
            className="text-white mr-2"
            onClick={() => setShowOriginal(false)}
          >
            Before
          </div>
          <div className="text-white" onClick={() => setShowOriginal(true)}>
            After
          </div>
        </div>
      )}
    </div>
  );
}

function SnapshotRow({ snapshot, onSelect }) {
  const filename = snapshot.file?.split("/").pop();

  const status = !snapshot.mainSnapshot
    ? "new"
    : snapshot.mainSnapshot.sha == snapshot.sha
    ? "same"
    : "different";

  const bgColor =
    status === "new" ? "green" : status === "same" ? "blue" : "red";
  return (
    <div
      className="flex items-center text-white"
      onClick={() => onSelect(snapshot)}
      key={snapshot.id}
    >
      <div
        style={{
          backgroundColor: bgColor,
          width: "5px",
          height: "5px",
          borderRadius: "5px",
          marginRight: "10px",
        }}
      ></div>
      {filename}
    </div>
  );
}

function useFetchSnapshots(branch) {
  const { data, error, isLoading } = useSWR(
    encodeURI(`/api/getSnapshotsForBranch?branch=${branch}`),
    fetcher
  );

  const {
    data: mainData,
    error: mainError,
    isLoading: mainLoading,
  } = useSWR(encodeURI(`/api/getSnapshotsForBranch?branch=main`), fetcher);

  if (isLoading || mainLoading) return { isLoading: true };
  if (error || mainError) return { error: error || mainError };

  const snapshots = data.snapshots.map((snapshot) => {
    const mainSnapshot = mainData.snapshots.find(
      (mainSnapshot) => mainSnapshot.file === snapshot.file
    );

    return {
      ...snapshot,
      mainSnapshot,
    };
  });

  return { data: snapshots };
}

export default function Home() {
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);

  const { data, error, isLoading } = useFetchSnapshots("test");

  if (isLoading) return <div>loading...</div>;
  if (error) return <div>error</div>;
  console.log({ selectedSnapshot });

  return (
    <div className="bg-black h-full p-4">
      <div className="flex h-full overflow-hidden">
        <div className="flex flex-col h-full overflow-y-scroll">
          {data.map((snapshot) => (
            <SnapshotRow
              key={snapshot.id}
              onSelect={setSelectedSnapshot}
              snapshot={snapshot}
            />
          ))}
        </div>

        <div className="flex flex-grow justify-center">
          {selectedSnapshot && <Snapshot snapshot={selectedSnapshot} />}
        </div>
      </div>
    </div>
  );
}
