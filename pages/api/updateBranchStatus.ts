import type { NextApiRequest, NextApiResponse } from "next";

import {
  Action,
  getProject,
  Project,
  Snapshot,
} from "../../lib/server/supabase/supabase";
import {
  updateAction,
  getActionFromBranch,
} from "../../lib/server/supabase/actions";
import { getSnapshotsForAction } from "../../lib/server/supabase/snapshots";
import { updateComment, updateCheck } from "../../lib/github";
import { postgrestErrorToError } from "../../lib/server/supabase/errors";
import { ErrorResponse, GenericResponse, SuccessResponse } from "./types";
import { getDeltaBranchUrl } from "../../lib/delta";
import { getBranch } from "../../lib/server/supabase/branches";

export type BranchStatus = "failure" | "neutral" | "success";

type IssueComment = Awaited<ReturnType<typeof updateComment>>["data"];
type CheckRuns = Awaited<ReturnType<typeof updateCheck>>["data"];

export type RequestParams = {
  branchId: string;
  projectId: string;
  status: BranchStatus;
};
export type ResponseData = {
  action: Action;
  check: CheckRuns;
  comment: IssueComment | null;
};
export type Response = GenericResponse<ResponseData>;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { branchId, projectId, status } = request.body as {
    branchId: string;
    projectId: string;
    status: BranchStatus;
  };
  if (!branchId || !projectId || !status) {
    return response.status(422).json({
      error: new Error(
        'Missing required param(s) "branch", "projectId", or "status"'
      ),
    } as ErrorResponse);
  }

  const branchRecord = await getBranch(branchId);
  if (branchRecord.error) {
    return response.status(500).json({
      error: postgrestErrorToError(branchRecord.error),
    } as ErrorResponse);
  }
  const branch = branchRecord.data;

  const projectRecord = await getProject(projectId);
  if (projectRecord.error) {
    return response.status(500).json({
      error: postgrestErrorToError(projectRecord.error),
    } as ErrorResponse);
  }

  const organization = projectRecord.data.organization;
  const repository = projectRecord.data.repository;

  const action = await getActionFromBranch(branchId);
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

export function formatComment({
  project,
  branchName,
  snapshots,
  subTitle = "",
}: {
  project: Project;
  branchName: string;
  snapshots: Snapshot[];
  subTitle?: string;
}) {
  const deltaUrl = getDeltaBranchUrl(project, branchName);

  const numDifferent = snapshots.filter(
    (snapshot) => snapshot.primary_changed
  ).length;

  const snapshotList = snapshots
    .filter((snapshot) => snapshot.primary_changed)
    .slice(0, 10)
    .map(
      (snapshot) =>
        `<details>
          <summary>${
            snapshot.file.split("/")[snapshot.file.split("/").length - 1]
          }</summary>
          <img src="https://delta.replay.io/api/snapshot?path=${
            snapshot.path
          }" />
        </details>`
    )
    .join("\n");

  const title =
    numDifferent > 0
      ? `${numDifferent} of ${snapshots.length} changed`
      : "Nothing changed";
  return [
    `**<a href="${deltaUrl}">${title}</a>** ${subTitle}`,
    snapshotList,
  ].join("\n");
}
