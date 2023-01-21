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

export type SnapshotStatus =
  | "added"
  | "changed-action"
  | "changed-primary"
  | "deleted"
  | "unchanged";

export type SnapshotVariant = {
  changed: boolean;
  pathBranchData: string;
  pathMainData: string | null;
  pathDiffData: string;
  status: SnapshotStatus;
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

      let changed = false;
      let status: SnapshotStatus = "unchanged";
      if (datum.status === "Uploaded") {
        changed = true;
        status = "added";
      } else if (datum.action_changed) {
        changed = true;
        status = "changed-action";
      } else if (datum.primary_changed) {
        changed = true;
        status = "changed-primary";
      } else {
        // TODO status "deleted"
      }

      // TODO This is weird but "new" images also have entries for the main branch.
      // I think this is likely a backend bug.
      // We can work around it for now though to avoid the frontend showing confusing state.
      let snapshotMain = null;
      if (status !== "added") {
        snapshotMain =
          snapshotsForPrimaryBranch.find(({ file }) => file === datum.file) ??
          null;
      }

      // TODO This is another edge case I've seen in the data that probably indicates a bug on the server.
      if (datum.path === snapshotMain?.path) {
        changed = false;
        status = "unchanged";
      }

      const snapshotVariant: SnapshotVariant = {
        changed,
        pathBranchData: datum.path,
        pathMainData: snapshotMain?.path ?? null,
        pathDiffData: datum.primary_diff_path,
        status,
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
