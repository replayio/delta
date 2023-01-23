import type { NextApiRequest, NextApiResponse } from "next";

import { Action, Branch, getProject } from "../../lib/server/supabase/supabase";
import {
  updateAction,
  getActionFromBranch,
} from "../../lib/server/supabase/actions";
import { getSnapshotsForAction } from "../../lib/server/supabase/snapshots";
import { updateComment, updateCheck } from "../../lib/github";
import { formatComment } from "./github-event";
import { postgrestErrorToError } from "../../lib/server/supabase/errors";
import { ErrorResponse, GenericResponse, SuccessResponse } from "./types";

type IssueComment = Awaited<ReturnType<typeof updateComment>>["data"];
type CheckRuns = Awaited<ReturnType<typeof updateCheck>>["data"];

type ResponseData = {
  action: Action;
  check: CheckRuns;
  comment: IssueComment | null;
};

export type Response = GenericResponse<ResponseData>;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { branch, projectId, status } = request.body as {
    branch: Branch;
    projectId: string;
    status: "failure" | "neutral" | "success";
  };
  if (!branch || !projectId || !status) {
    return response.status(422).json({
      error: new Error(
        'Missing required param(s) "branch", "projectId", or "status"'
      ),
    } as ErrorResponse);
  }

  const projectRecord = await getProject(projectId);
  if (projectRecord.error) {
    return response.status(500).json({
      error: postgrestErrorToError(projectRecord.error),
    } as ErrorResponse);
  }

  const organization = projectRecord.data.organization;
  const repository = projectRecord.data.repository;

  const action = await getActionFromBranch(branch.id);
  if (action.error) {
    return response
      .status(500)
      .json({ error: postgrestErrorToError(action.error) } as ErrorResponse);
  }

  const { data: actionData, error: actionError } = await updateAction(
    action.data.id,
    { status }
  );
  if (actionError) {
    return response.status(500).json({
      error: postgrestErrorToError(actionError),
    } as ErrorResponse);
  }

  const { data: check } = await updateCheck(
    organization,
    repository,
    branch.check_id,
    {
      conclusion: status,
      title: status === "success" ? "Changes approved" : "Changes rejected",
      summary: "",
    }
  );

  let issueComment: IssueComment | null = null;
  if (branch.comment_id) {
    const snapshots = await getSnapshotsForAction(action.data.id);

    issueComment = (
      await updateComment(organization, repository, branch.comment_id, {
        body: formatComment({
          project: projectRecord.data,
          branchName: branch.name,
          snapshots: snapshots.data || [],
          subTitle: status === "success" ? "**(Approved)**" : "**(Rejected)**",
        }),
      })
    ).data;
  }

  response.status(200).json({
    data: {
      action: actionData,
      check,
      comment: issueComment,
    },
  } as SuccessResponse<ResponseData>);
}
