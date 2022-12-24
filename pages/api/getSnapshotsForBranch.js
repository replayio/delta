import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  const { branch, project_id } = req.query;

  const { action, error } = await getAction(project_id, branch);

  if (error) {
    console.log(error);
    res.status(500).json({ error });
  }

  const snapshots = await supabase
    .from("Snapshots")
    .select("*")
    .eq("action_id", actionId);

  if (snapshots.error) {
    console.log(snapshots.error);
    res.status(500).json({ error: snapshots.error });
  }

  //   console.log(snapshots);
  res.status(200).json({ branch, actionId, snapshots: snapshots.data });
}
