import type { NextApiRequest, NextApiResponse } from "next";

import { getDeltaBranchUrl } from "../../lib/delta";
import {
  CheckRun,
  IssueComment,
  updateCheck,
  updateComment,
} from "../../lib/github";
import { getBranch } from "../../lib/server/supabase/branches";
import { getRunForBranch, updateJob } from "../../lib/server/supabase/runs";
import { getProject } from "../../lib/server/supabase/projects";
import { BranchId, Run, Project, ProjectId, Snapshot } from "../../lib/types";
import {
  GenericResponse,
  sendErrorMissingParametersResponse,
  sendErrorResponseFromPostgrestError,
  sendResponse,
} from "./utils";
import { getSnapshotsForJob } from "../../lib/server/supabase/snapshots";

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

  const { data: runData, error: runError } = await getRunForBranch(branchId);
  if (runError) {
    response.setHeader("Content-Type", "application/json");
    return sendErrorResponseFromPostgrestError(response, runError);
  }

  const run = runData;
  const runId = run.id;

  const { error: updateError } = await updateJob(runId, { status });
  if (updateError) {
    return sendErrorResponseFromPostgrestError(response, updateError);
  }

  const check = await updateCheck(organization, repository, branch.check_id, {
    conclusion: status,
    title: status === "success" ? "Changes approved" : "Changes rejected",
    summary: "",
  });

  let issueComment: IssueComment | null = null;
  if (branch.comment_id) {
    const snapshots = await getSnapshotsForJob(runId);

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
    .filter((snapshot) => snapshot.primary_diff_path != null)
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
