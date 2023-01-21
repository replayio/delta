import sortedIndexBy from "lodash/sortedIndexBy";
import {
  getSnapshotsForActionResponse,
  getSnapshotsForBranchResponse,
  Snapshot,
} from "../lib/server/supabase/supabase";
import { fetchJSON } from "../utils/fetchJSON";
import { createGenericCache } from "./createGenericCache";
import { fetchProjectAsync } from "./ProjectCache";

export type SnapshotTheme = "dark" | "light";

export type SnapshotImage = {
  base64String: string;
  height: number;
  width: number;
};

export type SnapshotVariant = {
  changedFromPreviousAction: boolean;
  changedFromPrimaryBranch: boolean;
  pathBranchData: string;
  pathMainData: string | null;
  pathDiffData: string;
  theme: SnapshotTheme;
};

export type SnapshotFile = {
  file: string;
  fileName: string;
  variants: {
    dark: SnapshotVariant | null;
    light: SnapshotVariant | null;
  };
};

type Snapshots = {
  type: "snapshots";
  value: SnapshotFile[];
};

// Fetch base64 encoded snapshot image (with dimensions)
export const {
  getValueSuspense: fetchSnapshotSuspense,
  getValueAsync: fetchSnapshotAsync,
  getValueIfCached: fetchSnapshotIfCached,
} = createGenericCache<[snapshotPath: string], SnapshotImage>(
  (snapshotPath: string) =>
    fetchBase64Snapshot(
      `/api/downloadSnapshot?path=${encodeURI(snapshotPath)}`
    ),
  (snapshotPath: string) => snapshotPath
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
  (projectId: string, branchName: string, snapshotFile: string) =>
    fetchBase64Snapshot(
      `/api/snapshot-diff/?projectId=${projectId}&branch=${encodeURI(
        branchName
      )}&file=${snapshotFile}`
    ),
  (projectId: string, branchName: string, snapshotFile: string) =>
    JSON.stringify({ branchName, projectId, snapshotFile })
);

// Fetch list of snapshots for an action
export const {
  getValueSuspense: fetchSnapshotsForActionSuspense,
  getValueAsync: fetchSnapshotsForActionAsync,
  getValueIfCached: fetchSnapshotsForActionIfCached,
} = createGenericCache<[projectId: string, actionId: string], Snapshot[]>(
  (projectId: string, actionId: string) =>
    fetchJSON<getSnapshotsForActionResponse>(
      `/api/getSnapshotsForAction?action=${actionId}&project_id=${projectId}`
    ),
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
    fetchJSON<getSnapshotsForBranchResponse>(
      `/api/getSnapshotsForBranch?branch=${encodeURI(
        branchName
      )}&project_id=${projectId}`
    ),
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

    const fileNameToSnapshotMap: Map<string, SnapshotFile> = new Map();
    const snapshotFiles: SnapshotFile[] = [];

    snapshotsForAction.forEach((datum) => {
      const [fileName, theme] = parseFilePath(datum.file);

      const snapshotFile: SnapshotFile = fileNameToSnapshotMap.get(
        fileName
      ) ?? {
        file: datum.file,
        fileName,
        variants: {
          dark: null,
          light: null,
        },
      };

      if (!fileNameToSnapshotMap.has(fileName)) {
        fileNameToSnapshotMap.set(fileName, snapshotFile);

        const index = sortedIndexBy(
          snapshotFiles,
          snapshotFile,
          ({ fileName }) => fileName
        );
        snapshotFiles.splice(index, 0, snapshotFile);
      }

      const snapshotMain = snapshotsForPrimaryBranch.find(
        ({ file }) => file === datum.file
      );

      const snapshotVariant: SnapshotVariant = {
        changedFromPreviousAction: !!datum.action_changed,
        changedFromPrimaryBranch: !!datum.primary_changed,
        pathBranchData: datum.path,
        pathMainData: snapshotMain?.path ?? null,
        pathDiffData: datum.primary_diff_path,
        theme,
      };

      if (theme === "dark") {
        snapshotFile.variants.dark = snapshotVariant;
      } else {
        snapshotFile.variants.light = snapshotVariant;
      }
    });

    return snapshotFiles;
  },
  (projectId: string, actionId: string) =>
    JSON.stringify({ actionId, projectId })
);

async function fetchBase64Snapshot(uri: string): Promise<SnapshotImage> {
  const base64String = await fetchJSON<string>(encodeURI(uri));

  const snapshot = new Promise<SnapshotImage>((resolve, reject) => {
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
      throw Error(`Failed to download Snapshot at "${uri}"`);
    }
  });

  return snapshot;
}

function parseFilePath(
  path: string
): [fileName: string, theme: "dark" | "light"] {
  const fileName = path.split("/").pop()!;
  const theme = path.includes("/light/") ? "light" : "dark";
  return [fileName, theme];
}
