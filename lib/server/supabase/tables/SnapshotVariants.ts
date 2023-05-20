import {
  RunId,
  SnapshotId,
  SnapshotVariant,
  SnapshotVariantId,
} from "../../../types";
import { supabase } from "../../initSupabase";
import { assertQueryResponse, assertQuerySingleResponse } from "../supabase";

export async function getSnapshotVariantsForRun(runId: RunId) {
  {
    const records = await assertQueryResponse<{
      snapshot_variants: SnapshotVariant[];
    }>(
      () =>
        supabase
          .from("snapshots")
          .select("id, snapshot_variants(*)")
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
    return records.reduce((snapshotVariants: SnapshotVariant[], record) => {
      snapshotVariants.push(...record.snapshot_variants);
      return snapshotVariants;
    }, []);
  }
}

export async function getSnapshotVariantsForSnapshot(snapshotId: SnapshotId) {
  return await assertQueryResponse<SnapshotVariant>(
    () =>
      supabase
        .from("snapshot_variants")
        .select("*")
        .eq("snapshot_id", snapshotId)
        .order("delta_variant", { ascending: true }),
    `Could not find SnapshotVariants for Snapshot "${snapshotId}" `
  );
}

export async function insertSnapshotVariant(
  snapshotVariant: Omit<SnapshotVariant, "created_at" | "id">
) {
  return assertQuerySingleResponse<SnapshotVariant>(
    () => supabase.from("snapshot_variants").insert(snapshotVariant).single(),
    `Could not insert SnapshotVariant`
  );
}

export async function updateSnapshotVariant(
  snapshotVariantId: SnapshotVariantId,
  snapshotVariant: Partial<SnapshotVariant>
) {
  return assertQuerySingleResponse<SnapshotVariant>(
    () =>
      supabase
        .from("snapshot_variants")
        .update(snapshotVariant)
        .eq("id", snapshotVariantId)
        .single(),
    `Could not update SnapshotVariant "${snapshotVariantId}"`
  );
}
