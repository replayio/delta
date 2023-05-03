export type SnapshotDiffAdded = {
  file: string;
  newPath: string;
  type: "added";
};

export type SnapshotDiffChanged = {
  file: string;
  newPath: string;
  oldPath: string;
  type: "changed";
};

export type SnapshotDiffRemoved = {
  file: string;
  oldPath: string;
  type: "removed";
};

export type SnapshotDiff =
  | SnapshotDiffAdded
  | SnapshotDiffChanged
  | SnapshotDiffRemoved;

export function isSnapshotDiffAdded(
  snapshotDiff: SnapshotDiff
): snapshotDiff is SnapshotDiffAdded {
  return snapshotDiff.type === "added";
}

export function isSnapshotDiffChanged(
  snapshotDiff: SnapshotDiff
): snapshotDiff is SnapshotDiffChanged {
  return snapshotDiff.type === "changed";
}

export function isSnapshotDiffRemoved(
  snapshotDiff: SnapshotDiff
): snapshotDiff is SnapshotDiffRemoved {
  return snapshotDiff.type === "removed";
}
