import { getProject } from "../../lib/supabase";

export default async function handler(req, res) {
  const { projectId } = req.query;

  const { project, error } = await getProject(projectId);

  if (error) {
    console.log("error", error);
    res.status(500).json(error);
  }

  res.status(200).json(project);
}
