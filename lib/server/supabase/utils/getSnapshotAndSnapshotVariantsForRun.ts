import { RunId, Snapshot, SnapshotVariant } from "../../../types";
import { getSnapshotVariantsForSnapshot } from "../tables/SnapshotVariants";
import { getSnapshotsForRun } from "../tables/Snapshots";

export type SnapshotAndSnapshotVariants = {
  snapshot: Snapshot;
  snapshotVariants: {
    [variant: string]: SnapshotVariant;
  };
};

export async function getSnapshotAndSnapshotVariantsForRun(runId: RunId) {
  const snapshots = await getSnapshotsForRun(runId);

  const snapshotAndSnapshotVariants: SnapshotAndSnapshotVariants[] =
    await Promise.all(
      snapshots.map((snapshot) =>
        getSnapshotVariantsForSnapshot(snapshot.id)
          .then((snapshotVariants) => {
            const map = {};
            snapshotVariants.forEach((snapshotVariant) => {
              map[snapshotVariant.delta_variant] = snapshotVariant;
            });

            return map;
          })
          .then((snapshotVariants) => ({
            snapshot,
            snapshotVariants,
          }))
      )
    );

  return snapshotAndSnapshotVariants;
}
