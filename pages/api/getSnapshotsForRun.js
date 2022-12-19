import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  const { actionId } = req.query;

  console.log("actionId", actionId);
  const snapshots = await supabase
    .from("Snapshots")
    .select("*")
    .eq("action_id", actionId);

  console.log(snapshots);
  res.status(200).json(snapshots);
}
