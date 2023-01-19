import { Snapshot } from "../lib/server/supabase/supabase";
import { fetchSnapshot } from "../suspense/SnapshotCache";
import SnapshotImage from "./SnapshotImage";

const { useState } = require("react");

export function ImageSlider({ snapshot }: { snapshot: Snapshot }) {
  const [scrubber, setScrubber] = useState(50);

  let mainSnapshotPath = null;
  let path = null;
  if (snapshot) {
    path = snapshot.path;
    // @ts-ignore What is this? It's not defined on the type.
    const mainSnapshot = snapshot.mainSnapshot;
    if (mainSnapshot) {
      mainSnapshotPath = mainSnapshot.path;
    }
  }

  const data = path ? fetchSnapshot(path) : null;
  if (data == null) {
    return null;
  }

  const { height = 0, width = 0 } = data;

  return (
    <>
      <SnapshotImage
        path={path}
        style={{
          position: "absolute",
          top: "-1000px",
          right: "-10000px",
        }}
      />

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
              <SnapshotImage
                path={path}
                style={{
                  position: "absolute",
                  left: "0px",
                  top: "0px",
                  minWidth: `${width}px`,
                }}
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
                height: `${height}px`,
              }}
            >
              <SnapshotImage
                path={mainSnapshotPath}
                style={{
                  position: "absolute",
                  top: "0px",
                  right: "0px",
                  minWidth: `${width}px`,
                }}
              />
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
