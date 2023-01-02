import { getProject } from "../../lib/server/supabase/supabase";
import { getBranchFromProject } from "../../lib/server/supabase/branches";
import {
  updateAction,
  getActionFromBranch,
} from "../../lib/server/supabase/actions";

import { updateComment, updateCheck } from "../../lib/github";
import { getDeltaBranchUrl } from "../../lib/delta";

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
  const organization = projectRecord.data.organization;
  const repository = projectRecord.data.repository;

  const branchRecord = await getBranchFromProject(projectId, branch);
  if (branchRecord.error) {
    return res.status(500).json({ error: branchRecord.error });
  }

  const action = await getActionFromBranch(branchRecord.data.id);
  if (action.error) {
    return res.status(500).json({ error: action.error });
  }

  const updatedAction = await updateAction(action.data.id, { status });

  if (updatedAction.error) {
    return res.status(500).json({ error: updatedAction.error });
  }

  const updatedCheck = await updateCheck(
    organization,
    repository,
    branchRecord.data.check_id,
    { conclusion: status, title: "Changes approved", summary: "" }
  );

  const updatedComment = await updateComment(
    organization,
    repository,
    branchRecord.data.comment_id,
    {
      body: `Changes approved\n<a href="${getDeltaBranchUrl(
        projectRecord.data,
        branchRecord.data.name
      )}">View snapshots</a>`,
    }
  );

  if (updatedComment.status != 200) {
    return res.status(500).json({ error: updatedComment });
  }

  res.status(200).json({
    action: updatedAction.data,
    check: updatedCheck,
    comment: updatedComment,
  });
}
