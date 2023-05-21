import { diffBase64Images } from "./diff";
import { downloadSnapshot } from "./supabase/storage/Snapshots";
import { SnapshotVariantDiff, VariantToSnapshotVariant } from "./types";

type SnapshotVariantDiffObject = { [variant: string]: SnapshotVariantDiff };

export default async function diffSnapshotVariants(
  oldSnapshotVariants: VariantToSnapshotVariant,
  newSnapshotVariants: VariantToSnapshotVariant
): Promise<SnapshotVariantDiffObject> {
  const variants = Array.from(
    new Set([
      ...Object.keys(oldSnapshotVariants),
      ...Object.keys(newSnapshotVariants),
    ])
  );

  const diffObject: SnapshotVariantDiffObject = {};

  for (let index = 0; index < variants.length; index++) {
    const variant = variants[index];
    const oldSnapshotVariant = oldSnapshotVariants[variant];
    const newSnapshotVariant = newSnapshotVariants[variant];
    if (oldSnapshotVariant && newSnapshotVariant) {
      if (
        oldSnapshotVariant.supabase_path === newSnapshotVariant.supabase_path
      ) {
        continue;
      } else {
        const [oldImage, newImage] = await Promise.all([
          downloadSnapshot(oldSnapshotVariant.supabase_path),
          downloadSnapshot(newSnapshotVariant.supabase_path),
        ]);
        const { changed } = await diffBase64Images(oldImage, newImage);
        if (changed) {
          diffObject[variant] = {
            newPath: newSnapshotVariant.supabase_path,
            oldPath: oldSnapshotVariant.supabase_path,
            type: "changed",
          };
        } else {
          continue;
        }
      }
    } else if (oldSnapshotVariant != null) {
      diffObject[variant] = {
        oldPath: oldSnapshotVariant.supabase_path,
        type: "removed",
      };
    } else if (newSnapshotVariant != null) {
      diffObject[variant] = {
        newPath: newSnapshotVariant.supabase_path,
        type: "added",
      };
    } else {
      throw Error(`Both old and new snapshots are null`);
    }
  }

  return diffObject;
}
