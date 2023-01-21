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
        className="absolute"
        style={{
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
          className="relative w-full"
          style={{
            height: `${height}px`,
          }}
        >
          <div className="absolute h-full w-full top-0 left-0">
            <div
              className="relative overflow-hidden"
              style={{
                width: `${scrubber}%`,
                height: `${height}px`,
              }}
            >
              <div
                className="absolute top-0 left-0"
                style={{
                  minWidth: `${width}px`,
                }}
              >
                <SnapshotImage path={pathBranchData} />
              </div>
            </div>
          </div>
          <div
            className="absolute h-full top-0 right-0"
            style={{
              width: `${100 - scrubber}%`,
            }}
          >
            <div
              className="relative w-full overflow-hidden"
              style={{
                height: `${height}px`,
              }}
            >
              <div
                className="absolute top-0 right-0"
                style={{
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
        className="mt-1"
        id="image-slider-scrubber"
        max="100"
        min="0"
        onChange={(e) => {
          setScrubber(e.target.value);
        }}
        style={{
          width: `${width}px`,
        }}
        type="range"
        value={scrubber}
      />
    </>
  );
}
