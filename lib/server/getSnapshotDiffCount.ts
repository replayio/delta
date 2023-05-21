import { mergeSnapshotVariants } from "../../utils/snapshots";
import { SnapshotVariant } from "../types";
import { diffBase64Images } from "./diff";
import { downloadSnapshot } from "./supabase/storage/Snapshots";

export default async function getSnapshotDiffCount(
  oldSnapshotVariants: SnapshotVariant[],
  newSnapshotVariants: SnapshotVariant[]
): Promise<number> {
  let count = 0;

  const promises: Promise<void>[] = [];

  const merged = mergeSnapshotVariants(
    oldSnapshotVariants,
    newSnapshotVariants
  );

  for (let variant in merged) {
    const { new: newSnapshotVariant, old: oldSnapshotVariant } =
      merged[variant];
    if (oldSnapshotVariant && newSnapshotVariant) {
      if (
        oldSnapshotVariant.supabase_path !== newSnapshotVariant.supabase_path
      ) {
        // Different shas might still have the same image content
        // but we can at least avoid downloading and diffing most images this way
        promises.push(
          checkDiff(oldSnapshotVariant, newSnapshotVariant).then((diff) => {
            if (diff) {
              count++;
            }
          })
        );
      }
    } else if (oldSnapshotVariant != null) {
      count++;
    } else if (newSnapshotVariant != null) {
      count++;
    } else {
      // Unexpected
    }
  }

  await Promise.all(promises);

  return count;
}

async function checkDiff(
  oldSnapshotVariant: SnapshotVariant,
  newSnapshotVariant: SnapshotVariant
) {
  const [oldImage, newImage] = await Promise.all([
    downloadSnapshot(oldSnapshotVariant.supabase_path),
    downloadSnapshot(newSnapshotVariant.supabase_path),
  ]);
  const { changed } = await diffBase64Images(oldImage, newImage);
  if (changed) {
    return true;
  } else {
    return false;
  }
}
