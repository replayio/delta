import useSWR from "swr";
const { useState, useRef, useEffect } = require("react");
const fetcher = (...args) => fetch(...args).then((res) => res.json());
import { ArrowPathIcon } from "@heroicons/react/20/solid";

const Placeholder = () => (
  <div
    className="bg-gray-100 rounded-lg flex items-center justify-center text-gray-500"
    style={{ width: "200px", height: "100px", overflow: "hidden" }}
  >
    Unavailable
  </div>
);

export function Snapshot({ snapshot, project, branch }) {
  const [mode, setMode] = useState("slider");
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

  return (
    <div
      className="flex flex-col mt-4 overflow-y-auto overflow-x-auto  pb-20  items-center"
      style={{ minHeight: "300px", width: "calc(100% - 20px)" }}
    >
      <Toggle mode={mode} setMode={setMode} />
      {mode == "slider" ? (
        <ImageSlider data={data} mainData={mainData} />
      ) : (
        <div className="mt-4 flex items-center flex-col ">
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
        className="flex flex-col justify-center pt-4 "
        style={{ width: `${imageRect.width}px` }}
      >
        <div
          style={{
            position: "relative",
            width: `100%`,
            height: `${imageRect.height}px`,
          }}
          className="mt-4"
        >
          <input
            id="image-slider-scrubber"
            type="range"
            min="0"
            max="100"
            value={scrubber}
            style={{
              top: "calc(50% - 6px)",
              left: "-6px",
              position: "absolute",
              zIndex: 100,
              width: "calc(100% + 12px)",
            }}
            onChange={(e) => {
              setScrubber(e.target.value);
            }}
          />
          <div
            style={{
              width: "1px",
              height: "100%",
              position: "absolute",
              left: `calc(${scrubber}% )`,
              background: "#f0f0f0",
              zIndex: 99,
            }}
          />
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

function ToggleButton({ isSelected, onToggle, children }) {
  return (
    <div
      className={`flex justify-center cursor-pointer py-2 px-4 hover:bg-slate-200 ${
        isSelected ? "fill-violet-500" : "fill-slate-500"
      } `}
      onClick={onToggle}
      // style={{ width: "34px" }}
    >
      {children}
    </div>
  );
}

function Toggle({ mode, setMode }) {
  return (
    <div
      className="flex justify-between  bg-slate-100 border-slate-300 border"
      style={{
        borderRadius: "5px",
      }}
    >
      <ToggleButton
        isSelected={mode == "slider"}
        onToggle={() => setMode("slider")}
      >
        <svg
          width="18"
          height="14"
          viewBox="0 0 18 14"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M18 4L14 0V3H7V5H14V8M4 6L0 10L4 14V11H11V9H4V6Z" />
        </svg>
      </ToggleButton>

      <ToggleButton
        isSelected={mode == "diff"}
        onToggle={() => setMode("diff")}
      >
        <svg
          width="15"
          height="12"
          viewBox="0 0 15 12"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M7.5 2.8275L12.2925 10.5H2.7075L7.5 2.8275ZM7.5 0L0 12H15" />
        </svg>
      </ToggleButton>
    </div>
  );
}
