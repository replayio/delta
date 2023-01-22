import chalk from "chalk";
import { getProject } from "../../lib/server/supabase/supabase";
import { getBranch } from "../../lib/server/supabase/branches";
import {
  updateAction,
  getActionFromBranch,
} from "../../lib/server/supabase/actions";
import { getSnapshotsForAction } from "../../lib/server/supabase/snapshots";
import { formatComment } from "./github-event";

import { updateComment, updateCheck } from "../../lib/github";

import omit from "lodash/omit";
export default async function handler(req, res) {
  const { branch, projectId, status } = req.body;

  if (!branch || !projectId || !status) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  console.log(
    chalk.bold("updateBranchStatus()"),
    `\n  project: ${chalk.greenBright(projectId)}`,
    `\n  branch: ${chalk.greenBright(branch.id)}`,
    `\n  status: ${chalk.greenBright(status)}`,
    branch
  );

  const projectRecord = await getProject(projectId);
  if (projectRecord.error) {
    console.error("Project error:", projectRecord.error);
    return res.status(500).json({ error: projectRecord.error });
  }
  const organization = projectRecord.data.organization;
  const repository = projectRecord.data.repository;

  // const branchRecord = await getBranch(branch.id);
  // if (branchRecord.error) {
  //   console.error("Branch error:", branchRecord.error);
  //   return res.status(500).json({ error: branchRecord.error });
  // }

  const action = await getActionFromBranch(branch.id);
  if (action.error) {
    console.error("Branch action error:", action.error);
    return res.status(500).json({ error: action.error });
  }

  const updatedAction = await updateAction(action.data.id, { status });
  if (updatedAction.error) {
    console.error("Updated action error:", updatedAction.error);
    return res.status(500).json({ error: updatedAction.error });
  }

  const updatedCheck = await updateCheck(
    organization,
    repository,
    branch.check_id,
    {
      conclusion: status,
      title: status === "success" ? "Changes approved" : "Changes rejected",
      summary: "",
    }
  );
  console.log(
    "updateBranchStatus (3) updated check",
    omit(updatedCheck.data, ["app"])
  );

  let updatedComment;
  if (branch.comment_id) {
    const snapshots = await getSnapshotsForAction(action.data.id);

    updatedComment = await updateComment(
      organization,
      repository,
      branch.comment_id,
      {
        body: formatComment({
          project: projectRecord.data,
          branchName: branch,
          snapshots: snapshots.data || [],
          subTitle: status === "success" ? "**(Approved)**" : "**(Rejected)**",
        }),
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
