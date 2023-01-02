import {
  getProject,
  getProjectByShort,
} from "../../lib/server/supabase/supabase";

export default async function handler(req, res) {
  const { projectId, projectShort } = req.query;
  console.log(`getProject (1) - ${projectId}, ${projectShort}`);

  const project = await (projectId
    ? getProject(projectId)
    : getProjectByShort(projectShort));

  if (project.error) {
    res.status(500).json(project.error);
  }

  console.log(`getProject (finished) - ${project.data?.repository}`);
  res.status(200).json(project.data);
}
