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

    if (actionResponse.error) {
      res.status(500).json({ error: actionResponse.error });
      return;
    }

    return res.status(200).json({ data: actionResponse.data[0] });
  } catch (e) {
    console.error("error", e);
    res.status(500).json({ error: e });
  }
}
