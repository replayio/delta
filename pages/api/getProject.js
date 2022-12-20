import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
const Buffer = require("buffer").Buffer;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  const { projectId } = req.query;

  const { data, error } = await supabase
    .from("Projects")
    .select("*")
    .eq("id", projectId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.log("error", error);
    res.status(500).json(error);
  }

  res.status(200).json(data[0]);
}
