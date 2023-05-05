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
  const displayName = snapshotDiff.file.replace(/-/g, " ").replace(".png", "");

  return (
    <Link
      className={`items-center px-2 text-sm cursor-pointer text-ellipsis truncate shrink-0 block font-light text-violet-900 leading-6 capitalize ${
        isSelected ? "bg-violet-200" : "hover:bg-violet-100"
      }`}
      href={encodeURI(
        `/project/${projectSlug}?branchId=${branchId}&runId=${runId}&fileName=${snapshotDiff.file}&`
      )}
    >
      {displayName}
    </Link>
  );
}
