import Image from "next/image";
import { fetchSnapshotDiff } from "../suspense/SnapshotCache";

export default function SnapshotDiffImage({ branch, file, projectId }) {
  const base64String = fetchSnapshotDiff(projectId, branch, file);

  return (
    <Image alt="Snapshot image" src={`data:image/png;base64,${base64String}`} />
  );
}
