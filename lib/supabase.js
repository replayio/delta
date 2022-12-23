import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

const Buffer = require("buffer").Buffer;
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
  const response = await supabase
    .from("Snapshots")
    .select("*, Actions(branch)")
    .eq("file", image.file)
    .eq("Actions.project_id", projectId)
    .eq("Actions.branch", "main")
    .limit(1);

  return response.data[0];
}

function insertSnapshot(sha, actionId, projectId, image, status, changed) {
  return supabase.from("Snapshots").insert([
    {
      sha,
      action_id: actionId,
      path: `${projectId}/${sha}.png`,
      file: image.file,
      status,
      changed,
    },
  ]);
}

async function fetchSnapshot(path) {
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

module.exports = {
  fetchSnapshot,
  getImageFromMain,
  uploadImage,
  fetchProjectId,
  insertSnapshot,
};
