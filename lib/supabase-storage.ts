import createClient from "./initServerSupabase";
import { createHash } from "crypto";
import { Snapshot } from "./supabase";

const supabase = createClient();
const Buffer = require("buffer").Buffer;

export async function uploadSnapshot(
  image: { content: string; file: string },
  projectId: string
): Promise<{ error: string } | { snapshot: Snapshot; error: null }> {
  const sha = createHash("sha256").update(image.content).digest("hex");

  const res = await supabase.storage
    .from("snapshots")
    .upload(`${projectId}/${sha}.png`, Buffer.from(image.content, "base64"), {
      contentType: "image/png",
    });

  if (res.error) {
    console.log("error", res.error);
    return { error: (res.error as any).error };
  }

  return { snapshot: res.data[0], error: null };
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
