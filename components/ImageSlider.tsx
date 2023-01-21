import { ChangeEvent, Dispatch, SetStateAction } from "react";
import { fetchSnapshotSuspense } from "../suspense/SnapshotCache";

export function ImageSlider({
  onChange,
  pathData,
  value,
}: {
  onChange: Dispatch<SetStateAction<number>>;
  pathData: string;
  value: number;
}) {
  const { width = 0 } = fetchSnapshotSuspense(pathData);

  return (
    <>
      <input
        className="mt-1"
        id="image-slider-scrubber"
        max="100"
        min="0"
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(parseInt(event.target.value))
        }
        style={{
          width: `${width}px`,
        }}
        type="range"
        value={value}
      />
    </>
  );
}
