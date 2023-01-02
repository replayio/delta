import { getPublicProjects } from "../../lib/server/supabase/supabase";

export default async function handler(req, res) {
  const projects = await getPublicProjects();

  if (projects.error) {
    res.status(500).json(projects.error);
  }

  res.status(200).json(projects.data);
}
