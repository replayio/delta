import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  const { project_id, pr_url, pr_title, pr_number, name } = req.body;

  try {
    const branchResponse = await supabase.from("Branch").insert([
      {
        project_id,
        pr_url,
        pr_title,
        pr_number,
        name,
      },
    ]);

    console.log(branchResponse);

    if (branchResponse.error) {
      res.status(400).json({ error: branchResponse.error });
      return;
    }

    return res.status(200).json({ data: branchResponse.data[0] });
  } catch (e) {
    console.error("error", e);
    res.status(400).json({ error: e });
  }
}
