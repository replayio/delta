import { getProject } from "../../lib/supabase";

export default async function handler(req, res) {
  const { projectId } = req.query;
  const project = await getProject(projectId);

  if (project.error) {
    res.status(500).json(project.error);
  }

  res.status(200).json(project.data);
}
