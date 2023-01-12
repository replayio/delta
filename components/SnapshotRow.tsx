import Link from "next/link";
import { useRouter } from "next/router";

export function SnapshotRow({ snapshot, selectedSnapshot, currentAction }) {
  const filename = snapshot.file
    ?.split("/")
    .pop()
    .replace(/-/g, " ")
    .replace(".png", "");

  const isSelected = snapshot.id === selectedSnapshot?.id;
  const router = useRouter();
  const { short, branch } = router.query;

  return (
    <Link
      className={`items-center px-4 text-sm cursor-pointer text-ellipsis truncate shrink-0 block font-light text-violet-900 leading-6 capitalize ${
        isSelected ? "bg-violet-200" : "hover:bg-violet-100"
      }`}
      href={encodeURI(
        `/project/${short}?branch=${branch}&snapshot=${snapshot.id}&action=${currentAction.id}`
      )}
      key={snapshot.id}
    >
      {filename}
    </Link>
  );
}
