import {
  updateActionStatus,
  getActionFromBranch,
  getBranchFromProject,
  getProject,
} from "../../lib/supabase";

import { updateCheck } from "../../lib/github";

export default async function handler(req, res) {
  const { branch, projectId, status } = req.body;

  if (!branch || !projectId || !status) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  console.log("updateBranchStatus", branch, projectId, status);

  const projectRecord = await getProject(projectId);
  if (projectRecord.error) {
    return res.status(500).json({ error: projectRecord.error });
  }

  const branchRecord = await getBranchFromProject(projectId, branch);
  if (branchRecord.error) {
    return res.status(500).json({ error: branchRecord.error });
  }

  const action = await getActionFromBranch(branchRecord.data.id);
  if (action.error) {
    return res.status(500).json({ error: action.error });
  }

  const { data, error } = await updateActionStatus(action.data.id, status);

  const updatedCheck = await updateCheck(
    projectRecord.data.organization,
    projectRecord.data.repository,
    branchRecord.data.check_id,
    { conclusion: status, title: "Changes approved", summary: "" }
  );

  if (error) {
    return res.status(500).json({ error });
  }

  res.status(200).json(data, updatedCheck);
}
