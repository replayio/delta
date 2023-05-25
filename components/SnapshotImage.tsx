import Image from "next/image";
import { snapshotImageCache } from "../suspense/SnapshotVariantCache";

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
    <Image
      alt="Snapshot image"
      className={className}
      height={height}
      src={base64StringToImageSource(base64String)}
      width={width}
    />
  );
}

export function base64StringToImageSource(base64String: string) {
  return `data:image/png;base64,${base64String}`;
}
