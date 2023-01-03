import createClient from "../../initServerSupabase";
import { createHash } from "crypto";
import { Snapshot } from "./supabase";

const supabase = createClient();
const Buffer = require("buffer").Buffer;

export async function uploadSnapshot(
  content: string | Buffer,
  projectId: string
): Promise<
  | { error: string; data: null }
  | { data: { path: string; sha: string }; error: null }
> {
  const sha = createHash("sha256").update(content).digest("hex");
  const path = `${projectId}/${sha}.png`;

  if (typeof content === "string") {
    content = Buffer.from(content, "base64");
  }

  const res = await supabase.storage.from("snapshots").upload(path, content, {
    contentType: "image/png",
  });

  if (res.error) {
    return { error: (res.error as any).error, data: { sha, path } };
  }

  return { data: { path, sha }, error: null };
}

export async function downloadSnapshot(
  path: string
): Promise<{ error: string; data: null } | { data: string; error: null }> {
  console.log("downloadSnapshot", path);
  const { data, error } = await supabase.storage
    .from("snapshots")
    .download(path);

  if (error) {
    return { error: error as any, data: null };
  }

  const fileBuffer = Buffer.from(await data.arrayBuffer());

  const image = fileBuffer.toString("base64");
  return { data: image, error: null };
}

export async function listSnapshots(
  projectId: string
): Promise<{ error: string; data: null } | { data: any[]; error: null }> {
  const { data, error } = await supabase.storage
    .from("snapshots")
    .list(projectId, {
      limit: 100,
    });

  if (error) {
    return { error: error as any, data: null };
  }

  return { data, error: null };
}

export async function listCorruptedSnapshots(
  projectId: string
): Promise<any[]> {
  const snapshots = await listSnapshots(projectId);
  if (snapshots.error) {
    return [];
  }

  return snapshots.data.filter((s) => s.metadata == null);
}

export async function removeCorruptedSnapshots(projectId: string) {
  const snapshots = await listCorruptedSnapshots(projectId);
  if (snapshots.length === 0) {
    return;
  }

  return supabase.storage
    .from("snapshots")
    .remove(snapshots.map((s) => `${projectId}/${s.name}`));
}
