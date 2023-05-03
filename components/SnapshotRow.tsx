import Link from "next/link";
import { useRouter } from "next/router";
import { SnapshotDiff } from "../lib/server/types";
import { Run } from "../lib/types";

export function SnapshotRow({
  isSelected,
  run,
  snapshotDiff,
}: {
  isSelected: boolean;
  run: Run | null;
  snapshotDiff: SnapshotDiff;
}) {
  const router = useRouter();
  const { short: shortProjectId, branch: branchName = "" } = router.query;

  const displayName = snapshotDiff.file.replace(/-/g, " ").replace(".png", "");

  const runId = run?.id || "";

  return (
    <Link
      className={`items-center px-2 text-sm cursor-pointer text-ellipsis truncate shrink-0 block font-light text-violet-900 leading-6 capitalize ${
        isSelected ? "bg-violet-200" : "hover:bg-violet-100"
      }`}
      href={encodeURI(
        `/project/${shortProjectId}?run=${runId}&branch=${branchName}&fileName=${snapshotDiff.file}&`
      )}
    >
      {displayName}
    </Link>
  );
}
