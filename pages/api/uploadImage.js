import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

const apiKey = "0cd8d2b6-919e-4ece-abf2-f91c03616e0f";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  process.env.SUPABASE_SERVICE_KEY
);

async function upsertRunRecord(run, userId) {
  let runRecord;

  let runResponse = await supabase
    .from("runs")
    .upsert([{ run_id: run, user_id: userId }]);

  if (runResponse.error?.code == "23505") {
    runResponse = await supabase.from("runs").select("*").eq("run_id", run);
    runRecord = runResponse.data[0];
  } else {
    runRecord = runResponse[0];
  }

  return runRecord;
}

export default async function handler(req, res) {
  let runResponse;
  try {
    const { image, run } = req.body;

    let { data: userId, error: userError } = await supabase.rpc(
      "apikey_to_user_id",
      {
        apikey: apiKey,
        keymode: "{all}",
      }
    );

    const runRecord = await upsertRunRecord(run, userId);

    const uploadResponse = await supabase.storage
      .from("snapshots")
      .upload(
        `${userId}/${run}/${image.file}`,
        Buffer.from(image.content, "base64")
      );

    const insertResponse = await supabase.from("snapshots").insert([
      {
        user_id: userId,
        file: image.file,
        run_id: runRecord.id,
        path: uploadResponse.data?.Key || "",
        status: uploadResponse.error
          ? uploadResponse.error?.statusCode === "409"
            ? "duplicate"
            : uploadResponse.error?.statusCode
          : "uploaded",
      },
    ]);

    console.log("insertResponse", insertResponse);

    res.status(200).json({ ...uploadResponse, runResponse });
  } catch (e) {
    res.status(200).json({ error: e.message });
  }
}
