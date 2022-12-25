import createClient from "./initServerSupabase";
import { createHash } from "crypto";

const supabase = createClient();
const Buffer = require("buffer").Buffer;

async function uploadSnapshot(image, projectId) {
  const sha = createHash("sha256").update(image.content).digest("hex");

  const res = await supabase.storage
    .from("snapshots")
    .upload(`${projectId}/${sha}.png`, Buffer.from(image.content, "base64"), {
      contentType: "image/png",
    });

  if (res.error) {
    console.log("error", res.error);
    return { error: res.error };
  }

  return { snapshot: res.data[0] };
}

async function downloadSnapshot(path) {
  const { data, error } = await supabase.storage
    .from("snapshots")
    .download(path);

  if (error) {
    console.log("error", error);
    return { error };
  }

  const fileBuffer = Buffer.from(await data.arrayBuffer());

  const image = fileBuffer.toString("base64");
  return { data: image };
}

module.exports = { downloadSnapshot, uploadSnapshot };
