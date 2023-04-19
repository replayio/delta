import createClient from "../../initServerSupabase";
import { createHash } from "crypto";

import type { FileObject } from "@supabase/storage-js";
import { maybeRetry, retryOnError } from "./supabase";

const supabase = createClient();
const Buffer = require("buffer").Buffer;

export type StoredSnapshot = {
  path: string;
  sha: string;
};

type UploadResult = {
  data: StoredSnapshot | null;
  error: string | null;
};

export async function uploadSnapshot(
  content: string | Buffer,
  projectId: string
): Promise<UploadResult> {
  const sha = createHash("sha256").update(content).digest("hex");
  const path = `${projectId}/${sha}.png`;

  if (typeof content === "string") {
    content = Buffer.from(content, "base64");
  }

  const res = await maybeRetry(
    () =>
      supabase.storage.from("snapshots").upload(path, content, {
        contentType: "image/png",
      }),
    (result) =>
      !!result.error && result.error.message !== "The resource already exists"
  );

  if (res.error) {
    return { error: (res.error as any).error, data: { sha, path } };
  }

  return { data: { path, sha }, error: null };
}

export async function downloadSnapshot(
  path: string
): Promise<{ error: Error | null; data: string | null }> {
  const { data, error } = await retryOnError(() =>
    supabase.storage.from("snapshots").download(path)
  );

  if (data == null || error) {
    return { error, data: null };
  }

  const fileBuffer = Buffer.from(await data.arrayBuffer());

  const image = fileBuffer.toString("base64");
  return { data: image, error: null };
}

export async function listSnapshots(
  projectId: string
): Promise<{ data: FileObject[] | null; error: string | null }> {
  const { data, error } = await retryOnError(() =>
    supabase.storage.from("snapshots").list(projectId, {
      limit: 100,
    })
  );

  if (error) {
    return { error: error as any, data: null };
  }

  return { data, error: null };
}

export async function listCorruptedSnapshots(
  projectId: string
): Promise<any[]> {
  const { data, error } = await listSnapshots(projectId);
  if (data == null || error) {
    return [];
  }

  return data.filter((s) => s.metadata == null);
}

export async function removeCorruptedSnapshots(projectId: string) {
  const snapshots = await listCorruptedSnapshots(projectId);
  if (snapshots.length === 0) {
    return;
  }

  return retryOnError(() =>
    supabase.storage
      .from("snapshots")
      .remove(snapshots.map((s) => `${projectId}/${s.name}`))
  );
}
