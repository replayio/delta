import sortedIndexBy from "lodash/sortedIndexBy";

import { Snapshot } from "../lib/server/supabase/supabase";
import { ResponseData } from "../pages/api/getMostFrequentlyUpdatedSnapshots";
import {
  downloadSnapshot,
  getMostFrequentlyUpdatedSnapshots,
  getSnapshotDiff,
  getSnapshotsForAction,
  getSnapshotsForBranch,
} from "../utils/ApiClient";
import { createGenericCache } from "./createGenericCache";
import { fetchProjectAsync } from "./ProjectCache";

export type SnapshotTheme = "dark" | "light";

export type SnapshotImage = {
  base64String: string;
  height: number;
  width: number;
};

export type SnapshotStatus =
  | "added"
  | "changed-action"
  | "changed-primary"
  | "deleted"
  | "unchanged";

export type SnapshotVariant = {
  changed: boolean;
  pathBranchData: string | null;
  pathMainData: string | null;
  pathDiffData: string | null;
  status: SnapshotStatus;
  theme: SnapshotTheme;
};

export type SnapshotFile = {
  fileName: string;
  variants: {
    dark: SnapshotVariant | null;
    light: SnapshotVariant | null;
  };
};

// Fetch list of snapshots for a branch
export const {
  getValueSuspense: fetchFrequentlyUpdatedSnapshotsSuspense,
  getValueAsync: fetchFrequentlyUpdatedSnapshotsAsync,
  getValueIfCached: fetchFrequentlyUpdatedSnapshotsIfCached,
} = createGenericCache<[projectShort: string, afterDate: string], ResponseData>(
  (projectShort: string, afterDate: string) =>
    getMostFrequentlyUpdatedSnapshots({
      afterDate,
      projectId: "",
      projectShort,
    }),
  (projectShort: string, afterDate: string) =>
    JSON.stringify({ afterDate, projectShort })
);

// Fetch base64 encoded snapshot image (with dimensions)
export const {
  getValueSuspense: fetchSnapshotSuspense,
  getValueAsync: fetchSnapshotAsync,
  getValueIfCached: fetchSnapshotIfCached,
} = createGenericCache<[path: string], SnapshotImage>(
  async (path: string) => {
    const base64String = await downloadSnapshot({ path });
    return await createSnapshotImage(base64String);
  },
  (path: string) => path
);

// Fetch base64 encoded snapshot diff image (with dimensions)
export const {
  getValueSuspense: fetchSnapshotDiffSuspense,
  getValueAsync: fetchSnapshotDiffAsync,
  getValueIfCached: fetchSnapshotDiffIfCached,
} = createGenericCache<
  [projectId: string, branchName: string, snapshotFile: string],
  SnapshotImage
>(
  async (projectId: string, branchName: string, snapshotFile: string) => {
    const base64String = await getSnapshotDiff({
      branchName,
      projectId,
      snapshotFile,
    });
    return await createSnapshotImage(base64String);
  },
  (projectId: string, branchName: string, snapshotFile: string) =>
    JSON.stringify({ branchName, projectId, snapshotFile })
);

// Fetch list of snapshots for an action
export const {
  getValueSuspense: fetchSnapshotsForActionSuspense,
  getValueAsync: fetchSnapshotsForActionAsync,
  getValueIfCached: fetchSnapshotsForActionIfCached,
} = createGenericCache<[actionId: string, projectId: string], Snapshot[]>(
  (projectId: string, actionId: string) =>
    getSnapshotsForAction({ actionId, projectId }),
  (projectId: string, actionId: string) =>
    JSON.stringify({ actionId, projectId })
);

// Fetch list of snapshots for a branch
export const {
  getValueSuspense: fetchSnapshotsForBranchSuspense,
  getValueAsync: fetchSnapshotsForBranchAsync,
  getValueIfCached: fetchSnapshotsForBranchIfCached,
} = createGenericCache<[projectId: string, branchName: string], Snapshot[]>(
  (projectId: string, branchName: string) =>
    getSnapshotsForBranch({ branchName, projectId }),
  (projectId: string, branchName: string) =>
    JSON.stringify({ branchName, projectId })
);

// Fetch list of snapshots and their change metadata, grouped by file
export const {
  getValueSuspense: fetchSnapshotFilesSuspense,
  getValueAsync: fetchSnapshotFilesAsync,
  getValueIfCached: fetchSnapshotFilesIfCached,
} = createGenericCache<[projectId: string, actionId: string], SnapshotFile[]>(
  async (projectId: string, actionId: string) => {
    // TODO We could parallelize some of the requests below.
    const project = await fetchProjectAsync(projectId, null);
    const primaryBranch = project.primary_branch;
    const snapshotsForPrimaryBranch = await fetchSnapshotsForBranchAsync(
      projectId,
      primaryBranch
    );
    const snapshotsForAction = await fetchSnapshotsForActionAsync(
      projectId,
      actionId
    );

    // Gather the unique set of snapshots;
    // Be sure to scan both arrays to handle added and deleted snapshots.
    const fileNameToBranchSnapshotsMap: Map<
      string,
      {
        branchSnapshots: {
          dark: Snapshot | null;
          light: Snapshot | null;
        };
        primarySnapshots: {
          dark: Snapshot | null;
          light: Snapshot | null;
        };
      }
    > = new Map();

    const getOrCreateRecord = (fileName: string) => {
      if (!fileNameToBranchSnapshotsMap.has(fileName)) {
        fileNameToBranchSnapshotsMap.set(fileName, {
          branchSnapshots: {
            dark: null,
            light: null,
          },
          primarySnapshots: {
            dark: null,
            light: null,
          },
        });
      }
      return fileNameToBranchSnapshotsMap.get(fileName)!;
    };

    snapshotsForAction.forEach((snapshot) => {
      const [fileName, theme] = parseFilePath(snapshot.file);

      const record = getOrCreateRecord(fileName);
      record.branchSnapshots[theme] = snapshot;
    });
    snapshotsForPrimaryBranch.forEach((snapshot) => {
      const [fileName, theme] = parseFilePath(snapshot.file);

      const record = getOrCreateRecord(fileName);
      record.primarySnapshots[theme] = snapshot;
    });

    const snapshotFiles: SnapshotFile[] = [];

    const addVariant = (
      theme: SnapshotTheme,
      snapshotFile: SnapshotFile,
      snapshotMain: Snapshot | null,
      snapshotBranch: Snapshot | null
    ) => {
      let changed = false;
      let status: SnapshotStatus = "unchanged";
      if (snapshotBranch === null) {
        changed = true;
        status = "deleted";
      } else if (snapshotMain === null) {
        changed = true;
        status = "added";
      } else if (snapshotBranch.action_changed) {
        changed = true;
        status = "changed-action";
      } else if (snapshotBranch.primary_changed) {
        changed = true;
        status = "changed-primary";
      }

      // TODO This is weird but "new" images also have entries for the main branch.
      // I think this is likely a backend bug.
      // We can work around it for now though to avoid the frontend showing confusing state.
      let pathMainData: string | null = null;
      if (status !== "added") {
        pathMainData = snapshotMain?.path ?? null;
      }

      // TODO This is another edge case I've seen in the data that probably indicates a bug on the server.
      if (snapshotBranch?.path === snapshotMain?.path) {
        changed = false;
        status = "unchanged";
      }

      const snapshotVariant: SnapshotVariant = {
        changed,
        pathBranchData: snapshotBranch?.path ?? null,
        pathMainData,
        pathDiffData: snapshotBranch?.primary_diff_path ?? null,
        status,
        theme,
      };

      if (theme === "dark") {
        snapshotFile.variants.dark = snapshotVariant;
      } else {
        snapshotFile.variants.light = snapshotVariant;
      }
    };

    fileNameToBranchSnapshotsMap.forEach((record, fileName) => {
      const snapshotFile: SnapshotFile = {
        fileName,
        variants: {
          dark: null,
          light: null,
        },
      };

      addVariant(
        "dark",
        snapshotFile,
        record.primarySnapshots.dark,
        record.branchSnapshots.dark
      );

      addVariant(
        "light",
        snapshotFile,
        record.primarySnapshots.light,
        record.branchSnapshots.light
      );

      const index = sortedIndexBy(
        snapshotFiles,
        snapshotFile,
        ({ fileName }) => fileName
      );
      snapshotFiles.splice(index, 0, snapshotFile);
    });

    return snapshotFiles;
  },
  (projectId: string, actionId: string) =>
    JSON.stringify({ actionId, projectId })
);

async function createSnapshotImage(
  base64String: string
): Promise<SnapshotImage> {
  return new Promise<SnapshotImage>((resolve, reject) => {
    try {
      const image = new Image();
      image.addEventListener("error", (event) => {
        reject(event.error);
      });
      image.addEventListener("load", () => {
        resolve({
          base64String,
          height: image.naturalHeight,
          width: image.naturalWidth,
        });
      });
      image.src = `data:image/png;base64,${base64String}`;
    } catch (error) {
      reject(error);
    }
  });
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function parseFilePath(
  path: string
): [fileName: string, theme: "dark" | "light"] {
  const fileName = path.split("/").pop()!;
  const theme = path.includes("/light/") ? "light" : "dark";
  return [fileName, theme];
}
