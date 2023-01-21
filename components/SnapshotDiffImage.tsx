import Image from "next/image";
import { fetchSnapshotDiffSuspense } from "../suspense/SnapshotCache";

export default function SnapshotDiffImage({ branch, file, projectId }) {
  const { base64String, height, width } = fetchSnapshotDiffSuspense(
    projectId,
    branch,
    file
  );

  // if (process.env.NODE_ENV === "development") {
  //   console.groupCollapsed(`<SnapshotDiffImage branch="${branch}" file="${file}" projectId="${projectId}">`);
  //   console.log("base64String:", base64String);
  //   console.log("height:", height);
  //   console.log("width:", width);
  //   console.groupEnd();
  // }

  return (
    <Image
      alt="Snapshot diff image"
      height={height}
      src={`data:image/png;base64,${base64String}`}
      width={width}
    />
  );
}
