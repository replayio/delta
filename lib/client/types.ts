import { SnapshotDiff } from "../server/types";

export type SnapshotDiffWithMetadata = SnapshotDiff & {
  metadata: {
    displayName: string;
    theme: string;
  };
};
