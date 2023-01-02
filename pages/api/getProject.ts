import {
  getProject,
  getProjectByShort,
} from "../../lib/server/supabase/supabase";

export default async function handler(req, res) {
  const { projectId, projectShort } = req.query;
  const project = await (projectId
    ? getProject(projectId)
    : getProjectByShort(projectShort));

  if (project.error) {
    res.status(500).json(project.error);
  }

  res.status(200).json(project.data);
}
