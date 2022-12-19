import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  const { projectId, branch, metadata } = req.body;

  try {
    const actionResponse = await supabase.from("Actions").insert([
      {
        project_id: projectId,
        branch,
        metadata,
      },
    ]);

    console.log(actionResponse);

    res.status(200).json(actionResponse);
  } catch (e) {
    console.error("erro", e);
    res.status(500).json({ error: e });
  }
}
