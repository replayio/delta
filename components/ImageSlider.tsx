import { fetchSnapshotSuspense } from "../suspense/SnapshotCache";
import SnapshotImage from "./SnapshotImage";

const { useState } = require("react");

export function ImageSlider({
  pathBranchData,
  pathMainData,
}: {
  pathBranchData: string;
  pathMainData: string;
}) {
  const [scrubber, setScrubber] = useState(50);

  const { height = 0, width = 0 } = fetchSnapshotSuspense(pathBranchData);

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: "-1000px",
          right: "-10000px",
        }}
      >
        <SnapshotImage path={pathBranchData} />
      </div>

      <div
        className="flex flex-col justify-center "
        style={{ width: `${width}px` }}
      >
        <div
          style={{
            position: "relative",
            width: `100%`,
            height: `${height}px`,
          }}
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
                height: `${height}px`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "0px",
                  top: "0px",
                  minWidth: `${width}px`,
                }}
              >
                <SnapshotImage path={pathBranchData} />
              </div>
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
                height: `${height}px`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "0px",
                  right: "0px",
                  minWidth: `${width}px`,
                }}
              >
                <SnapshotImage path={pathMainData} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <input
        id="image-slider-scrubber"
        type="range"
        min="0"
        max="100"
        value={scrubber}
        style={{
          marginTop: "10px",
          width: `${width}px`,
        }}
        onChange={(e) => {
          setScrubber(e.target.value);
        }}
      />
    </>
  );
}
