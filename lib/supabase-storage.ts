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
): Promise<{ error: string; data: null } | { data: Snapshot; error: null }> {
  console.log("downloadSnapshot", path);
  const { data, error } = await supabase.storage
    .from("snapshots")
    .download(path);

  if (error) {
    console.log("error", error);
    return { error: (error as any).error, data: null };
  }

  const fileBuffer = Buffer.from(await data.arrayBuffer());

  const image = fileBuffer.toString("base64");
  return { data: image, error: null };
}
