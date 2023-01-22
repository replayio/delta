import { downloadSnapshot } from "../../lib/server/supabase/storage";

export default async function handler(req, res) {
  const { path } = req.query;
  const { data, error } = await downloadSnapshot(path);

  if (data == null || error) {
    return res
      .status(500)
      .json({ error: error || Error("Could not download snapshot data") });
  }

  return res
    .setHeader("Content-Type", "image/png")
    .status(200)
    .send(Buffer.from(data, "base64"));
}
