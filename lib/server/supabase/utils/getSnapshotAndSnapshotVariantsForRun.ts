import { RunId, Snapshot, SnapshotVariant } from "../../../types";
import { supabase } from "../../initSupabase";
import { VariantToSnapshotVariant } from "../../types";
import { assertQueryResponse } from "../supabase";

export type SnapshotAndSnapshotVariants = {
  snapshot: Snapshot;
  snapshotVariants: VariantToSnapshotVariant;
};

export async function getSnapshotAndSnapshotVariantsForRun(runId: RunId) {
  const records = await assertQueryResponse<
    Snapshot & {
      snapshot_variants: SnapshotVariant[];
    }
  >(
    () =>
      supabase
        .from("snapshots")
        .select("*, snapshot_variants(*)")
        .eq("run_id", runId)
        .order("delta_test_filename", {
          ascending: true,
        })
        .order("delta_test_name", {
          ascending: true,
        })
        .order("delta_image_filename", {
          ascending: true,
        })
        .order("delta_variant", {
          ascending: true,
          foreignTable: "snapshot_variants",
        }),
    `Could not find SnapshotVariants for Run "${runId}"`
  );

  return records.map((record) => {
    const { snapshot_variants: snapshotVariantsArray, ...snapshot } = record;

    const snapshotVariants: VariantToSnapshotVariant = {};
    snapshotVariantsArray.forEach((snapshotVariant) => {
      snapshotVariants[snapshotVariant.delta_variant] = snapshotVariant;
    });

    return {
      snapshot,
      snapshotVariants,
    };
  });
}
