import Link from "next/link";
import { useRouter } from "next/router";
import { Job } from "../lib/types";
import { SnapshotFile } from "../suspense/SnapshotCache";

export function SnapshotRow({
  currentJob,
  isSelected,
  snapshotFile,
}: {
  currentJob: Job | null;
  isSelected: boolean;
  snapshotFile: SnapshotFile;
}) {
  const router = useRouter();
  const { short: shortProjectId, branch: branchName = "" } = router.query;

  const displayName = snapshotFile.fileName
    .replace(/-/g, " ")
    .replace(".png", "");

  const jobId = currentJob?.id || "";

  return (
    <Link
      className={`items-center px-2 text-sm cursor-pointer text-ellipsis truncate shrink-0 block font-light text-violet-900 leading-6 capitalize ${
        isSelected ? "bg-violet-200" : "hover:bg-violet-100"
      }`}
      href={encodeURI(
        `/project/${shortProjectId}?job=${jobId}&branch=${branchName}&fileName=${snapshotFile.fileName}&`
      )}
    >
      {displayName}
    </Link>
  );
}
