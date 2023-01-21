import { getBranchByName } from "../../lib/server/supabase/branches";

export default async function handler(req, res) {
  const { name } = req.query;
  console.log(`getBranchByName (1) - "${name}"`);

  const branch = await getBranchByName(name);

  if (branch.error) {
    res.status(500).json(branch.error);
  }

  console.log(`getBranchByName (finished) -`, branch.data);
  res.status(200).json(branch.data);
}
