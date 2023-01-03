import createClient from "../../lib/initServerSupabase";

const supabase = createClient();

export default async function handler(req, res) {
  const { projectId } = req.query;

  const { data, error } = await supabase
    .from("Actions")
    .select("*, Branches(project_id, name, status, pr_number)")
    .eq("Branches.project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.log("error", error);
    res.status(500).json(error);
  }

  res.status(200).json(data);
}
