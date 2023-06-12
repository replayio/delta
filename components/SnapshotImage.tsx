import { snapshotImageCache } from "../suspense/SnapshotVariantCache";
import Base64Image from "./Base64Image";

export default function SnapshotImage({
  className,
  path,
}: {
  className?: string;
  path: string;
}) {
  const { base64String, height, width } = snapshotImageCache.read(path);

  // if (process.env.NODE_ENV === "development") {
  //   console.groupCollapsed(`<SnapshotImage path="${path}">`);
  //   console.log("base64String:", base64String);
  //   console.log("height:", height);
  //   console.log("width:", width);
  //   console.groupEnd();
  // }

  return (
    <Base64Image
      base64String={base64String}
      className={className}
      height={height}
      title="Snapshot image"
      width={width}
    />
  );
}
