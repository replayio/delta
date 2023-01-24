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
import {
  updateComment,
  updateCheck,
  CheckRun,
  IssueComment,
} from "../../lib/github";
import {
  GenericResponse,
  sendErrorResponseFromPostgrestError,
  sendResponse,
  sendErrorMissingParametersResponse,
} from "./utils";
import { getDeltaBranchUrl } from "../../lib/delta";
import { getBranch } from "../../lib/server/supabase/branches";

export type BranchStatus = "failure" | "neutral" | "success";

export type RequestParams = {
  branchId: string;
  projectId: string;
  status: BranchStatus;
};
export type ResponseData = {
  action: Action;
  check: CheckRun;
  comment: IssueComment | null;
};
export type Response = GenericResponse<ResponseData>;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { branchId, projectId, status } = request.query as RequestParams;
  if (!branchId || !projectId || !status) {
    return sendErrorMissingParametersResponse(response, {
      branchId,
      projectId,
      status,
    });
  }

  const branchRecord = await getBranch(branchId);
  if (branchRecord.error) {
    response.setHeader("Content-Type", "application/json");
    return sendErrorResponseFromPostgrestError(response, branchRecord.error);
  }
  const branch = branchRecord.data;

  const projectRecord = await getProject(projectId);
  if (projectRecord.error) {
    response.setHeader("Content-Type", "application/json");
    return sendErrorResponseFromPostgrestError(response, projectRecord.error);
  }

  const organization = projectRecord.data.organization;
  const repository = projectRecord.data.repository;

  const action = await getActionFromBranch(branchId);
  if (action.error) {
    response.setHeader("Content-Type", "application/json");
    return sendErrorResponseFromPostgrestError(response, action.error);
  }

  const { data: actionData, error: actionError } = await updateAction(
    action.data.id,
    { status }
  );
  if (actionError) {
    return sendErrorResponseFromPostgrestError(response, actionError);
  }

  const check = await updateCheck(organization, repository, branch.check_id, {
    conclusion: status,
    title: status === "success" ? "Changes approved" : "Changes rejected",
    summary: "",
  });

  let issueComment: IssueComment | null = null;
  if (branch.comment_id) {
    const snapshots = await getSnapshotsForAction(action.data.id);

    issueComment = await updateComment(
      organization,
      repository,
      branch.comment_id,
      {
        body: formatComment({
          project: projectRecord.data,
          branchName: branch.name,
          snapshots: snapshots.data || [],
          subTitle: status === "success" ? "**(Approved)**" : "**(Rejected)**",
        }),
      }
    );
  }

  return sendResponse<ResponseData>(response, {
    action: actionData,
    check,
    comment: issueComment,
  });
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
