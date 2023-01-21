import createClient from "../../lib/initServerSupabase";

const supabase = createClient();

export default async function handler(req, res) {
  const { branchId } = req.query;
  console.log("getActions() branchId:", branchId);

  const { data, error } = await supabase
    .from("Actions")
    .select("*")
    .eq("branch_id", branchId)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.log("error", error);
    res.status(500).json(error);
  }

  res.status(200).json(data);
}
