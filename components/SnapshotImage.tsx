import Image from "next/image";
import { CSSProperties } from "react";
import { fetchSnapshot } from "../suspense/SnapshotCache";

export default function SnapshotImage({
  path,
  style,
}: {
  path: string;
  style?: CSSProperties;
}) {
  const data = fetchSnapshot(path);
  const { base64String, height, width } = data;

  return (
    <Image
      alt="Snapshot image"
      height={height}
      src={`data:image/png;base64,${base64String}`}
      style={style}
      width={width}
    />
  );
}
