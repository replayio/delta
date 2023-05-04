import type { NextApiRequest, NextApiResponse } from "next";

import { getDeltaBranchUrl } from "../../lib/delta";

import diffSnapshots from "../../lib/server/diffSnapshots";
import { updateCheck } from "../../lib/server/github/Checks";
import { updateComment } from "../../lib/server/github/Comments";
import { CheckRun, IssueComment } from "../../lib/server/github/types";
import {
  getBranchForId,
  getPrimaryBranchForProject,
} from "../../lib/server/supabase/tables/Branches";
import { getProjectForId } from "../../lib/server/supabase/tables/Projects";
import {
  getMostRecentRunForBranch,
  updateRun,
} from "../../lib/server/supabase/tables/Runs";
import {
  getSnapshotsForGithubRun,
  getSnapshotsForRun,
} from "../../lib/server/supabase/tables/Snapshots";
import { SnapshotDiff } from "../../lib/server/types";
import { BranchId, Project, ProjectId, RunId, Snapshot } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./constants";
import { sendApiMissingParametersResponse, sendApiResponse } from "./utils";

export type BranchStatus = "failure" | "neutral" | "success";

export type RequestParams = {
  approved: string;
  branchId: BranchId;
  projectId: ProjectId;
  runId: RunId;
};
export type ResponseData = {
  check: CheckRun;
  comment: IssueComment | null;
};

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const {
    approved: approvedString,
    branchId,
    projectId,
    runId,
  } = request.query as RequestParams;
  if (!approvedString || !branchId || !projectId || !runId) {
    return sendApiMissingParametersResponse(response, {
      approved: approvedString,
      branchId,
      projectId,
      runId,
    });
  }

  const approved = approvedString === "true";

  try {
    const branch = await getBranchForId(branchId);
    const project = await getProjectForId(projectId);

    updateRun(runId, {
      delta_has_user_approval: approved,
    });

    const check = await updateCheck(
      project.organization,
      project.repository,
      branch.github_pr_check_id,
      {
        conclusion: approved ? "success" : "failure",
        title: approved ? "Changes approved" : "Changes rejected",
        summary: "",
      }
    );

    let issueComment: IssueComment | null = null;
    if (branch.github_pr_comment_id) {
      const snapshots = await getSnapshotsForRun(runId);

      const [comment] = await createDiffComment({
        branchName: branch.name,
        newSnapshots: snapshots,
        project,
      });

      issueComment = await updateComment(
        project.organization,
        project.repository,
        branch.github_pr_comment_id,
        {
          body: comment,
        }
      );
    }

    return sendApiResponse<ResponseData>(response, {
      data: {
        check,
        comment: issueComment,
      },
      httpStatusCode: HTTP_STATUS_CODES.OK,
    });
  } catch (error) {
    return sendApiResponse(response, {
      data: error,
      deltaErrorCode: DELTA_ERROR_CODE.STORAGE.DOWNLOAD_FAILED,
      httpStatusCode: HTTP_STATUS_CODES.NOT_FOUND,
    });
  }
}

export async function createDiffComment({
  branchName,
  newSnapshots,
  project,
}: {
  branchName: string;
  newSnapshots: Snapshot[];
  project: Project;
}): Promise<[comment: string, diff: SnapshotDiff[]]> {
  const primaryBranch = await getPrimaryBranchForProject(project);
  const primaryBranchRun = await getMostRecentRunForBranch(primaryBranch.id);
  const oldSnapshots = await getSnapshotsForGithubRun(primaryBranchRun.id);

  const diff = await diffSnapshots(oldSnapshots, newSnapshots);
  const numChanges = diff.length;
  const title = `${numChanges} snapshot changes from primary branch`;
  const deltaUrl = getDeltaBranchUrl(project, branchName);
  const comment = `**<a href="${deltaUrl}">${title}</a>**`;

  return [comment, diff];
}
