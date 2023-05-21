import { Snapshot, SnapshotVariant } from "../types";

export type VariantToSnapshotVariant = {
  [variant: string]: SnapshotVariant;
};

export type SnapshotVariantDiffAdded = {
  newPath: string;
  type: "added";
};

export type SnapshotVariantDiffChanged = {
  newPath: string;
  oldPath: string;
  type: "changed";
};

export type SnapshotVariantDiffRemoved = {
  oldPath: string;
  type: "removed";
};

export type SnapshotDiff = {
  snapshot: Snapshot;
  snapshotVariantDiffs: {
    [variant: string]: SnapshotVariantDiff;
  };
};

export type SnapshotVariantDiff =
  | SnapshotVariantDiffAdded
  | SnapshotVariantDiffChanged
  | SnapshotVariantDiffRemoved;

export function isSnapshotVariantDiffAdded(
  snapshotVariantDiff: SnapshotVariantDiff
): snapshotVariantDiff is SnapshotVariantDiffAdded {
  return snapshotVariantDiff.type === "added";
}

export function isSnapshotVariantDiffChanged(
  snapshotVariantDiff: SnapshotVariantDiff
): snapshotVariantDiff is SnapshotVariantDiffChanged {
  return snapshotVariantDiff.type === "changed";
}

export function isSnapshotVariantDiffRemoved(
  snapshotVariantDiff: SnapshotVariantDiff
): snapshotVariantDiff is SnapshotVariantDiffRemoved {
  return snapshotVariantDiff.type === "removed";
}
