import { mergeSnapshotAndSnapshotVariants } from "../../utils/snapshots";
import diffSnapshotVariants from "./diffSnapshotVariants";
import { SnapshotAndSnapshotVariants } from "./supabase/utils/getSnapshotAndSnapshotVariantsForRun";
import { SnapshotDiff } from "./types";

export async function computeSnapshotDiffs(
  oldSnapshotAndSnapshotVariants: SnapshotAndSnapshotVariants[],
  newSnapshotAndSnapshotVariants: SnapshotAndSnapshotVariants[]
): Promise<SnapshotDiff[]> {
  const merged = mergeSnapshotAndSnapshotVariants(
    oldSnapshotAndSnapshotVariants,
    newSnapshotAndSnapshotVariants
  );

  const promises: Promise<void>[] = [];
  const diffs: SnapshotDiff[] = [];
  for (let key in merged) {
    const { snapshot, variants } = merged[key];

    promises.push(
      diffSnapshotVariants(variants.old ?? {}, variants.new ?? {}).then(
        (snapshotVariantDiffs) => {
          if (snapshotVariantDiffs !== null) {
            diffs.push({
              snapshot,
              snapshotVariantDiffs,
            });
          }
        }
      )
    );
  }

  await Promise.all(promises);

  return diffs;
}
