import Link from "next/link";
import { SnapshotDiffWithMetadata } from "../lib/client/types";
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
  snapshotDiff: SnapshotDiffWithMetadata;
}) {
  return (
    <Link
      className={`flex flex-row gap-1 items-center px-2 text-sm cursor-pointer text-ellipsis truncate shrink-0 block font-light text-violet-900 leading-6 capitalize ${
        isSelected ? "bg-violet-200" : "hover:bg-violet-100"
      }`}
      href={encodeURI(
        `/project/${projectSlug}?branchId=${branchId}&runId=${runId}&fileName=${snapshotDiff.file}&`
      )}
    >
      <span className="flex-auto truncate">
        {snapshotDiff.metadata.displayName}
      </span>
      <small className="grow-0 shrink-0">({snapshotDiff.metadata.theme})</small>
    </Link>
  );
}
