import { fetchJSON } from "../utils/fetchJSON";
import createWakeable from "./createWakeable";
import {
  Record,
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
} from "./types";

export type Snapshot = {
  base64String: string;
  height: number;
  width: number;
};

const snapshotDiffRecords: Map<string, Record<Snapshot>> = new Map();
const snapshotRecords: Map<string, Record<Snapshot>> = new Map();

export function fetchSnapshot(snapshotPath: string): Snapshot {
  let record = snapshotRecords.get(snapshotPath);
  if (record == null) {
    const wakeable = createWakeable<Snapshot>(snapshotPath);

    record = {
      status: STATUS_PENDING,
      value: wakeable,
    };

    snapshotRecords.set(snapshotPath, record);

    // Suspense caches fire and forget; errors will be handled within the fetch function.
    fetchHelper(`/api/downloadSnapshot?path=${snapshotPath}`, record);
  }

  if (record!.status === STATUS_RESOLVED) {
    return record!.value;
  } else {
    throw record!.value;
  }
}

export function fetchSnapshotDiff(
  projectId: string,
  branch: string,
  snapshotFile: string
): Snapshot {
  const key = `${projectId}/${branch}/${snapshotFile}`;
  let record = snapshotDiffRecords.get(key);
  if (record == null) {
    const wakeable = createWakeable<Snapshot>(key);

    record = {
      status: STATUS_PENDING,
      value: wakeable,
    };

    snapshotDiffRecords.set(key, record);

    // Suspense caches fire and forget; errors will be handled within the fetch function.
    fetchHelper(
      `/api/snapshot-diff/?projectId=${projectId}&branch=${branch}&file=${snapshotFile}`,
      record
    );
  }

  if (record!.status === STATUS_RESOLVED) {
    return record!.value;
  } else {
    throw record!.value;
  }
}

async function fetchHelper(uri: string, record: Record<Snapshot>) {
  const wakeable = record.value;

  try {
    const response = await fetchJSON(encodeURI(uri));

    if (response.hasOwnProperty("error")) {
      throw response.error;
    }

    const base64String = response;

    const image = new Image();
    image.addEventListener("error", (event) => {
      record.status = STATUS_REJECTED;
      record.value = event.error;

      wakeable.reject(record.value);
    });
    image.addEventListener("load", () => {
      record.status = STATUS_RESOLVED;
      record.value = {
        base64String,
        height: image.naturalHeight,
        width: image.naturalWidth,
      };

      wakeable.resolve(record.value);
    });
    image.src = `data:image/png;base64,${base64String}`;
  } catch (error) {
    record.status = STATUS_REJECTED;
    record.value = Error(`Failed to download Snapshot at "${uri}"`);

    wakeable.reject(record.value);
  }
}
