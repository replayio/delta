import useSWR from "swr";
const { useState, useRef, useEffect } = require("react");
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

  console.log(
    isLoading,
    mainIsLoading,
    snapshot?.primary_diff_path && diffIsLoading
  );
  if (
    isLoading ||
    mainIsLoading ||
    (snapshot?.primary_diff_path && diffIsLoading)
  ) {
    return (
      <div className="flex justify-center items-center h-full">loading...</div>
    );
  }

  if (error || mainError || (snapshot?.primary_diff_path && diffError)) {
    return <div className="flex justify-center items-center h-full">error</div>;
  }

  return (
    <div
      className="flex flex-col px-10 mt-4 overflow-y-auto w-full pb-20 items-center"
      style={{ minHeight: "300px" }}
    >
      <ImageSlider data={data} mainData={mainData} />
      <div className="mt-4 flex items-center flex-col ">
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

function ImageSlider({ data, mainData }) {
  const testImage = useRef(null);
  const [scrubber, setScrubber] = useState(50);
  const [imageRect, setImageRect] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (testImage.current) {
      setImageRect({
        height: testImage.current.offsetHeight,
        width: testImage.current.offsetWidth,
      });
    }
  }, [testImage.current, mainData, data]);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={testImage}
        style={{
          position: "absolute",
          top: "-1000px",
          right: "-10000px",
        }}
        alt=""
        src={`data:image/png;base64,${data}`}
      />

      <div
        className="flex flex-col justify-center pt-4"
        style={{ width: `${imageRect.width}px` }}
      >
        <input
          type="range"
          min="0"
          max="100"
          value={scrubber}
          class="slider"
          id="myRange"
          onChange={(e) => {
            setScrubber(e.target.value);
          }}
        />
        <div
          style={{
            position: "relative",
            width: `100%`,
            height: `${imageRect.height}px`,
          }}
          className="mt-4"
        >
          <div
            style={{
              position: "absolute",
              left: "0px",
              height: "100%",
              top: "0px",
              width: "100%",
            }}
          >
            <div
              style={{
                position: "relative",
                width: `${scrubber}%`,
                overflow: "hidden",
                height: `${imageRect.height}px`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                style={{
                  position: "absolute",
                  left: "0px",
                  top: "0px",
                  minWidth: `${imageRect.width}px`,
                }}
                alt=""
                src={`data:image/png;base64,${data}`}
              />
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              right: "0px",
              height: "100%",
              top: "0px",
              width: `${100 - scrubber}%`,
            }}
          >
            <div
              style={{
                position: "relative",
                width: `100%`,
                overflow: "hidden",
                height: `${imageRect.height}px`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                style={{
                  position: "absolute",
                  top: "0px",
                  right: "0px",
                  minWidth: `${imageRect.width}px`,
                }}
                alt=""
                src={`data:image/png;base64,${mainData}`}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SnapshotImage({ data }) {
  if (!data) {
    return <Placeholder />;
  }
  return <img src={`data:image/png;base64,${data}`} />;
}
