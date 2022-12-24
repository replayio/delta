import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

const Buffer = require("buffer").Buffer;
dotenv.config({ path: "./.env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function uploadSnapshot(image, projectId, sha) {
  return await supabase.storage
    .from("snapshots")
    .upload(`${projectId}/${sha}.png`, Buffer.from(image.content, "base64"), {
      contentType: "image/png",
    });
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
