import Link from "next/link";
import { SnapshotDiff } from "../lib/server/types";
import { BranchId, ProjectSlug, RunId } from "../lib/types";

export function SnapshotRow({
  branchId,
  isSelected,
  projectSlug,
  runId,
  snapshotDiff,
}: {
  branchId: BranchId | null;
  isSelected: boolean;
  projectSlug: ProjectSlug;
  runId: RunId | null;
  snapshotDiff: SnapshotDiff;
}) {
  return (
    <Link
      className={`py-1 pr-2 pl-6 text-xs truncate cursor-pointer text-ellipsis truncate shrink-0 block font-light text-violet-900 ${
        isSelected ? "bg-violet-100" : "hover:bg-violet-100"
      }`}
      href={encodeURI(
        `/project/${projectSlug}?branchId=${branchId}&runId=${runId}&snapshotId=${snapshotDiff.snapshot.id}&`
      )}
      title={snapshotDiff.snapshot.delta_image_filename}
    >
      {snapshotDiff.snapshot.delta_image_filename}
    </Link>
  );
}
