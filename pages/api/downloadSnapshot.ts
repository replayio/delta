import { downloadSnapshot } from "../../lib/server/supabase/supabase-storage";

export default async function handler(req, res) {
  const { path } = req.query;
  const snapshot = await downloadSnapshot(path);

  if (snapshot.error) {
    return res.status(500).json({ error: snapshot.error });
  }

  res.status(200).json(snapshot.data);
}
