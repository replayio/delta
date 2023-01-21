import Image from "next/image";
import { fetchSnapshotSuspense } from "../suspense/SnapshotCache";

export default function SnapshotImage({ path }: { path: string }) {
  const { base64String, height, width } = fetchSnapshotSuspense(path);

  // if (process.env.NODE_ENV === "development") {
  //   console.groupCollapsed(`<SnapshotImage path="${path}">`);
  //   console.log("base64String:", base64String);
  //   console.log("height:", height);
  //   console.log("width:", width);
  //   console.groupEnd();
  // }

  return (
    <Image
      alt="Snapshot image"
      height={height}
      src={`data:image/png;base64,${base64String}`}
      width={width}
    />
  );
}
