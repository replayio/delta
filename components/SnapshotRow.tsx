import Link from "next/link";
import { useRouter } from "next/router";
import { Action } from "../lib/server/supabase/supabase";
import { SnapshotFile } from "../suspense/SnapshotCache";

export function SnapshotRow({
  currentAction,
  isSelected,
  snapshotFile,
}: {
  currentAction: Action;
  isSelected: boolean;
  snapshotFile: SnapshotFile;
}) {
  const router = useRouter();
  const { short: shortProjectId, branch: branchName = "" } = router.query;

  const displayName = snapshotFile.fileName
    .replace(/-/g, " ")
    .replace(".png", "");

  return (
    <Link
      className={`items-center px-2 text-sm cursor-pointer text-ellipsis truncate shrink-0 block font-light text-violet-900 leading-6 capitalize ${
        isSelected ? "bg-violet-200" : "hover:bg-violet-100"
      }`}
      href={encodeURI(
        `/project/${shortProjectId}?action=${currentAction.id}&branch=${branchName}&fileName=${snapshotFile.fileName}&`
      )}
    >
      {displayName}
    </Link>
  );
}
