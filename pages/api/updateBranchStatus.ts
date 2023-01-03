import { getProject } from "../../lib/server/supabase/supabase";
import { getBranchFromProject } from "../../lib/server/supabase/branches";
import {
  updateAction,
  getActionFromBranch,
} from "../../lib/server/supabase/actions";

import { updateComment, updateCheck } from "../../lib/github";
import { getDeltaBranchUrl } from "../../lib/delta";
import omit from "lodash/omit";
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
  console.log(
    "updateBranchStatus (3) updated check",
    omit(updatedCheck.data, ["app"])
  );

  let updatedComment;
  if (branchRecord.data.comment_id) {
    const message =
      status == "success" ? "Changes approved" : "Changes rejected";
    updatedComment = await updateComment(
      organization,
      repository,
      branchRecord.data.comment_id,
      {
        body: `${message}\n<a href="${getDeltaBranchUrl(
          projectRecord.data,
          branchRecord.data.name
        )}">View Delta</a>`,
      }
    );

    if (updatedComment.status != 200) {
      console.log(
        "updateBranchStatus (4) failed to update comment",
        updatedComment
      );
    }
  }

  res.status(200).json({
    action: updatedAction.data,
    check: updatedCheck,
    comment: updatedComment,
  });
}
