import type { NextApiRequest, NextApiResponse } from "next";

import { getDeltaBranchUrl } from "../../lib/delta";
import {
  CheckRun,
  IssueComment,
  updateCheck,
  updateComment,
} from "../../lib/github";
import { getBranch } from "../../lib/server/supabase/branches";
import { getProject } from "../../lib/server/supabase/projects";
import { getRunForBranch, updateRun } from "../../lib/server/supabase/runs";
import { getSnapshotsForRun } from "../../lib/server/supabase/snapshots";
import { BranchId, Project, ProjectId, Run, Snapshot } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./statusCodes";
import {
  GenericResponse,
  sendErrorMissingParametersResponse,
  sendErrorResponseFromPostgrestError,
  sendResponse,
} from "./utils";

export type BranchStatus = "failure" | "neutral" | "success";

export type RequestParams = {
  branchId: BranchId;
  projectId: ProjectId;
  status: BranchStatus;
};
export type ResponseData = {
  check: CheckRun;
  comment: IssueComment | null;
  run: Run;
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
    return sendErrorResponseFromPostgrestError(
      response,
      branchRecord.error,
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
      `Could not find Branch with id "${branchId}"`
    );
  }
  const branch = branchRecord.data;

  const projectRecord = await getProject(projectId);
  if (projectRecord.error) {
    response.setHeader("Content-Type", "application/json");
    return sendErrorResponseFromPostgrestError(
      response,
      projectRecord.error,
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
      `Could not find Project with id "${projectId}"`
    );
  }

  const organization = projectRecord.data.organization;
  const repository = projectRecord.data.repository;

  const { data: runData, error: runError } = await getRunForBranch(branchId);
  if (runError) {
    response.setHeader("Content-Type", "application/json");
    return sendErrorResponseFromPostgrestError(
      response,
      runError,
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
      `Could not find Run for Branch id "${branchId}"`
    );
  }

  const run = runData;
  const runId = run.id;

  const { error: updateError } = await updateRun(runId, { status });
  if (updateError) {
    return sendErrorResponseFromPostgrestError(
      response,
      updateError,
      HTTP_STATUS_CODES.FAILED_DEPENDENCY,
      DELTA_ERROR_CODE.DATABASE.UPDATE_FAILED,
      `Could not update Run with id "${runId}" to status "${status}"`
    );
  }

  const check = await updateCheck(organization, repository, branch.check_id, {
    conclusion: status,
    title: status === "success" ? "Changes approved" : "Changes rejected",
    summary: "",
  });

  let issueComment: IssueComment | null = null;
  if (branch.comment_id) {
    const snapshots = await getSnapshotsForRun(runId);

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
    check,
    comment: issueComment,
    run,
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
    (snapshot) => snapshot.primary_diff_path != null
  ).length;

  const snapshotList = snapshots
    .filter(
      (snapshot) =>
        snapshot.primary_diff_path != null && snapshot.primary_num_pixels > 0
    )
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
