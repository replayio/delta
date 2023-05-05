import { createHash } from "crypto";
import { supabase } from "../../initSupabase";

import type { FileObject } from "@supabase/storage-js";
import { ProjectId } from "../../../types";
import { assertStorage, assertStorageValue, maybeRetry } from "../supabase";

const Buffer = require("buffer").Buffer;

export type StoredSnapshot = {
  path: string;
  sha: string;
};

export async function downloadSnapshot(path: string): Promise<string> {
  const data = await assertStorageValue<Blob>(
    () => supabase.storage.from("snapshots").download(path),
    `Could not download Snapshot for path "${path}"`
  );

  const fileBuffer = Buffer.from(await data.arrayBuffer());
  return fileBuffer.toString("base64");
}

export async function listCorruptedSnapshots(
  projectId: ProjectId
): Promise<any[]> {
  const snapshots = await listSnapshots(projectId);
  return snapshots.filter((snapshot) => snapshot.metadata == null);
}

export async function listSnapshots(
  projectId: ProjectId
): Promise<FileObject[]> {
  return await assertStorageValue<FileObject[]>(
    () =>
      supabase.storage.from("snapshots").list(projectId, {
        limit: 100,
      }),
    `Could not download Snapshots for Project "${projectId}"`
  );
}

export async function removeCorruptedSnapshots(projectId: ProjectId) {
  const snapshots = await listCorruptedSnapshots(projectId);
  if (snapshots.length === 0) {
    return;
  }

  return assertStorage(
    () =>
      supabase.storage
        .from("snapshots")
        .remove(snapshots.map((s) => `${projectId}/${s.name}`)),
    `Could not remove corrupted Snapshots for Project "${projectId}"`
  );
}

export async function uploadSnapshot(
  content: string | Buffer,
  projectId: ProjectId
): Promise<StoredSnapshot> {
  const sha = createHash("sha256").update(content).digest("hex");
  const path = `${projectId}/${sha}.png`;

  if (typeof content === "string") {
    content = Buffer.from(content, "base64");
  }

  const { data, error } = await maybeRetry(
    () =>
      supabase.storage.from("snapshots").upload(path, content, {
        contentType: "image/png",
      }),
    ({ data, error }) => {
      // Retry if there's been an error,
      // but not if the error was because the resource already exists.
      // https://postgrest.org/en/latest/errors.html#http-status-codes
      return !!error && !error.message.includes("The resource already exists");
    }
  );

  if (error && !error.message.includes("The resource already exists")) {
    throw error;
  }

  return { path, sha };
}
