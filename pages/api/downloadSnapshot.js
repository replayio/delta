import { downloadSnapshot } from "../../lib/supabase-storage";

export default async function handler(req, res) {
  const { path } = req.query;
  const { data, error } = await downloadSnapshot(path, res);

  if (error) {
    return res.status(500).json({ error });
  }

  res.status(200).json({ image: data });
}
