import { useRouter } from "next/router";
import Link from "next/link";
export function SnapshotRow({ snapshot, onSelect, index, selectedSnapshot }) {
  const filename = snapshot.file?.split("/").pop();
  const isSelected = snapshot.id === selectedSnapshot?.id;
  const router = useRouter();
  const { short, branch } = router.query;

  return (
    <Link
      className={`mt-1 flex items-center w-full px-4 text-sm cursor-pointer  text-ellipsis ${
        isSelected
          ? "bg-violet-500 text-white hover:bg-violet-600"
          : "text-gray-500 hover:bg-gray-100 "
      }`}
      href={encodeURI(
        `/project/${short}?branch=${branch}&file=${snapshot.file}`
      )}
      key={snapshot.id}
    >
      {filename}
    </Link>
  );
}
