const { createHash } = require("crypto");
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function fetchProjectId(actionId) {
  const actionRecord = await supabase
    .from("Actions")
    .select("*")
    .eq("id", actionId);
  console.log(actionRecord);
  const projectId = actionRecord.data[0].project_id;
  return projectId;
}

async function uploadImage(image, projectId, sha) {
  return await supabase.storage
    .from("snapshots")
    .upload(`${projectId}/${sha}.png`, Buffer.from(image.content, "base64"), {
      contentType: "image/png",
    });
}

async function getImageFromMain(image, projectId) {
  return await supabase
    .from("Snapshots")
    .select("*")
    .eq("file", image.file)
    .eq("project_id", projectId)
    .eq("branch", "main")
    .first();
}

export default async function handler(req, res) {
  const { image, actionId } = req.body;

  try {
    console.log("actionId", actionId);

    const projectId = await fetchProjectId(actionId);
    const sha = createHash("sha256").update(image.content).digest("hex");
    const uploadResponse = await uploadImage(image, projectId, sha);

    // const mainImage = await getImageFromMain(image, projectId);

    console.log(uploadResponse);
    const status = uploadResponse.data?.path
      ? "Uploaded"
      : uploadResponse.error?.error;

    const snapshotResponse = await supabase.from("Snapshots").insert([
      {
        sha,
        action_id: actionId,
        path: `${projectId}/${sha}.png`,
        file: image.file,
        status,
      },
    ]);

    console.log(snapshotResponse);

    res.status(200).json(snapshotResponse);
  } catch (e) {
    console.error("erro", e);
    res.status(500).json({ error: e });
  }
}
