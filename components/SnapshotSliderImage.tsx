import { snapshotImageCache } from "../suspense/SnapshotVariantCache";
import SnapshotImage from "./SnapshotImage";

export function SnapshotImageSlider({
  newPath,
  oldPath,
  percentage,
}: {
  newPath: string;
  oldPath: string;
  percentage: number;
}) {
  const { height = 0, width = 0 } = snapshotImageCache.read(newPath);

  return (
    <>
      <div
        className="absolute"
        style={{
          top: "-1000px",
          right: "-10000px",
        }}
      >
        <SnapshotImage path={newPath} />
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
                width: `${percentage}%`,
                height: `${height}px`,
              }}
            >
              <div
                className="absolute top-0 left-0"
                style={{
                  minWidth: `${width}px`,
                }}
              >
                <SnapshotImage path={newPath} />
              </div>
            </div>
          </div>
          <div
            className="absolute h-full top-0 right-0"
            style={{
              width: `${100 - percentage}%`,
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
                <SnapshotImage path={oldPath} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
