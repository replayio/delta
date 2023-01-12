const { useState, useRef, useEffect } = require("react");

export function ImageSlider({ data, mainData }) {
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
  }, []);

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
        className="flex flex-col justify-center "
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
      <input
        id="image-slider-scrubber"
        type="range"
        min="0"
        max="100"
        value={scrubber}
        style={{
          marginTop: "10px",
          width: `${imageRect.width}px`,
        }}
        onChange={(e) => {
          setScrubber(e.target.value);
        }}
      />
    </>
  );
}
