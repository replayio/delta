import { ChangeEvent, Dispatch, SetStateAction } from "react";
import withSuspenseLoader from "./withSuspenseLoader";

export default withSuspenseLoader(function ImageSlider({
  onChange,
  value,
}: {
  onChange: Dispatch<SetStateAction<number>>;
  value: number;
}) {
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
          width: 300,
        }}
        type="range"
        value={value}
      />
    </>
  );
});
