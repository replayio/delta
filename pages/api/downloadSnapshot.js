import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
const Buffer = require("buffer").Buffer;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  const { path } = req.query;
  const { data, error } = await supabase.storage
    .from("snapshots")
    .download(path);

  if (error) {
    console.log("error", error);
    res.status(500).json(error);
  }

  const fileBuffer = Buffer.from(await data.arrayBuffer());

  const image = fileBuffer.toString("base64");
  res.status(200).json({ image });
}
