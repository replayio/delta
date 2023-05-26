import { SnapshotAndSnapshotVariants } from "../lib/server/supabase/utils/getSnapshotAndSnapshotVariantsForRun";
import { VariantToSnapshotVariant } from "../lib/server/types";
import { Snapshot } from "../lib/types";

export type MergedSnapshotAndSnapshotVariants = {
  [key: string]: {
    snapshot: Snapshot;
    variants: {
      new: VariantToSnapshotVariant | null;
      old: VariantToSnapshotVariant | null;
    };
  };
};

export function mergeSnapshotAndSnapshotVariants(
  oldSnapshotAndSnapshotVariants: SnapshotAndSnapshotVariants[],
  newSnapshotAndSnapshotVariants: SnapshotAndSnapshotVariants[]
): MergedSnapshotAndSnapshotVariants {
  const merged: MergedSnapshotAndSnapshotVariants = {};

  oldSnapshotAndSnapshotVariants.forEach((record) => {
    const key = getSnapshotKey(record.snapshot);
    merged[key] = {
      snapshot: record.snapshot,
      variants: {
        new: null,
        old: record.snapshotVariants,
      },
    };
  });

  newSnapshotAndSnapshotVariants.forEach((record) => {
    const key = getSnapshotKey(record.snapshot);
    const value = merged[key];
    if (value) {
      value.snapshot = record.snapshot;
      value.variants.new = record.snapshotVariants;
    } else {
      merged[key] = {
        snapshot: record.snapshot,
        variants: {
          new: record.snapshotVariants,
          old: null,
        },
      };
    }
  });

  return merged;
}

function getSnapshotKey(snapshot: Snapshot): string {
  return `${snapshot.delta_test_filename}:${snapshot.delta_test_name}:${snapshot.delta_image_filename}`;
}
