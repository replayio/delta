import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

const apiKey = "0cd8d2b6-919e-4ece-abf2-f91c03616e0f";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  try {
    const { image, run } = req.body;

    let { data: userId, error: userError } = await supabase.rpc(
      "apikey_to_user_id",
      {
        apikey: apiKey,
        keymode: "{all}",
      }
    );

    const { data, error } = await supabase.storage
      .from("snapshots")
      .upload(
        `${userId}/${run}/${image.file}`,
        Buffer.from(image.content, "base64")
      );

    res.status(200).json({
      data,
      error,
    });
  } catch (e) {
    res.status(200).json({ error: e.message });
  }
}
