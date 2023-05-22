import { useContext } from "react";
import { SnapshotDiff } from "../lib/server/types";
import { SessionContext } from "./SessionContext";

export function SnapshotRow({ snapshotDiff }: { snapshotDiff: SnapshotDiff }) {
  const { snapshotIdDefault, transitionSnapshot } = useContext(SessionContext);
  return (
    <div
      className={`py-1 pr-2 pl-6 text-xs truncate cursor-pointer text-ellipsis truncate shrink-0 block font-light text-violet-900 ${
        snapshotDiff.snapshot.id === snapshotIdDefault
          ? "bg-violet-100"
          : "hover:bg-violet-100"
      }`}
      onClick={() => transitionSnapshot(snapshotDiff.snapshot.id)}
      title={snapshotDiff.snapshot.delta_image_filename}
    >
      {snapshotDiff.snapshot.delta_image_filename}
    </div>
  );
}
