import sortedIndexBy from "lodash/sortedIndexBy";

import { createCache } from "suspense";
import { RunId, ProjectId, ProjectShort, Snapshot } from "../lib/types";
import { ResponseData } from "../pages/api/getMostFrequentlyUpdatedSnapshots";
import {
  downloadSnapshot,
  getMostFrequentlyUpdatedSnapshots,
  getSnapshotDiff,
  getSnapshotsForBranch,
  getSnapshotsForRun,
} from "../utils/ApiClient";
import { projectCache } from "./ProjectCache";

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
export const frequentlyUpdatedSnapshotsCache = createCache<
  [projectShort: ProjectShort, afterDate: string],
  ResponseData
>({
  debugLabel: "frequentlyUpdatedSnapshots",
  getKey([projectShort, afterDate]) {
    return JSON.stringify({ afterDate, projectShort });
  },
  async load([projectShort, afterDate]) {
    return await getMostFrequentlyUpdatedSnapshots({
      afterDate,
      projectShort,
    });
  },
});

// Fetch base64 encoded snapshot image (with dimensions)
export const snapshotCache = createCache<[path: string], SnapshotImage>({
  debugLabel: "snapshot",
  async load([path]) {
    const base64String = await downloadSnapshot({ path });
    return await createSnapshotImage(base64String);
  },
});

// Fetch base64 encoded snapshot diff image (with dimensions)
export const snapshotDiffCache = createCache<
  [projectId: ProjectId, branchName: string, snapshotFile: string],
  SnapshotImage
>({
  debugLabel: "snapshotDiff",
  getKey([projectId, branchName, snapshotFile]) {
    return JSON.stringify({ branchName, projectId, snapshotFile });
  },
  async load([projectId, branchName, snapshotFile]) {
    const base64String = await getSnapshotDiff({
      branchName,
      projectId,
      snapshotFile,
    });
    return await createSnapshotImage(base64String);
  },
});

// Fetch list of snapshots for a Workflow run
export const snapshotsForRunCache = createCache<
  [projectId: ProjectId, runId: RunId],
  Snapshot[]
>({
  debugLabel: "snapshotsForRun",
  getKey([projectId, runId]) {
    return JSON.stringify({ runId, projectId });
  },
  async load([projectId, runId]) {
    return await getSnapshotsForRun({ runId: runId, projectId });
  },
});

// Fetch list of snapshots for a branch
export const snapshotsForBranchCache = createCache<
  [projectId: ProjectId, branchName: string],
  Snapshot[]
>({
  debugLabel: "snapshotsForBranch",
  getKey([projectId, branchName]) {
    return JSON.stringify({ branchName, projectId });
  },
  async load([projectId, branchName]) {
    return await getSnapshotsForBranch({ branchName, projectId });
  },
});

// Fetch list of snapshots and their change metadata, grouped by file
export const snapshotFilesCache = createCache<
  [projectId: ProjectId, runId: RunId],
  SnapshotFile[]
>({
  debugLabel: "snapshotFiles",
  getKey([projectId, runId]) {
    return JSON.stringify({ runId, projectId });
  },
  async load([projectId, runId]) {
    const project = await projectCache.readAsync(projectId, null);
    const primaryBranch = project.primary_branch;
    const [snapshotsForPrimaryBranch, snapshotsForRun] = await Promise.all([
      snapshotsForBranchCache.readAsync(projectId, primaryBranch),
      snapshotsForRunCache.readAsync(projectId, runId),
    ]);

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

    snapshotsForRun.forEach((snapshot) => {
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
      } else if (snapshotBranch.primary_diff_path !== null) {
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
});

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

function parseFilePath(
  path: string
): [fileName: string, theme: "dark" | "light"] {
  const fileName = path.split("/").pop()!;
  const theme = path.includes("/light/") ? "light" : "dark";
  return [fileName, theme];
}
