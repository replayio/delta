import type { NextApiRequest, NextApiResponse } from "next";

import getSnapshotDiffCount from "../../lib/server/getSnapshotDiffCount";
import { updateCheck } from "../../lib/server/github/Checks";
import { CheckRun } from "../../lib/server/github/types";
import {
  getBranchForId,
  getPrimaryBranchForProject,
} from "../../lib/server/supabase/tables/Branches";
import { getProjectForId } from "../../lib/server/supabase/tables/Projects";
import {
  getMostRecentRunForBranch,
  getRunForId,
  updateRun,
} from "../../lib/server/supabase/tables/Runs";
import { getSnapshotsForRun } from "../../lib/server/supabase/tables/Snapshots";
import { BranchId, ProjectId, RunId } from "../../lib/types";
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
    return sendApiMissingParametersResponse(request, response, {
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
    const run = await getRunForId(runId);

    updateRun(runId, {
      delta_has_user_approval: approved,
    });

    const primaryBranch = await getPrimaryBranchForProject(project);
    const primaryBranchRun = await getMostRecentRunForBranch(primaryBranch.id);
    const oldSnapshots = primaryBranchRun
      ? await getSnapshotsForRun(primaryBranchRun.id)
      : [];
    const newSnapshots = await getSnapshotsForRun(runId);

    const count = getSnapshotDiffCount(oldSnapshots, newSnapshots);
    const summary = count > 0 ? `${count} snapshots changed` : "No changes";
    const title = approved ? "Changed approved" : "Changes rejected";

    const check = await updateCheck(
      project.organization,
      project.repository,
      run.github_check_id,
      {
        conclusion: approved ? "success" : "failure",
        status: "completed",
        output: {
          summary,
          title,
        },
      }
    );

    return sendApiResponse<ResponseData>(request, response, {
      data: {
        check,
      },
      httpStatusCode: HTTP_STATUS_CODES.OK,
    });
  } catch (error) {
    return sendApiResponse(request, response, {
      data: error,
      deltaErrorCode: DELTA_ERROR_CODE.STORAGE.DOWNLOAD_FAILED,
      httpStatusCode: HTTP_STATUS_CODES.NOT_FOUND,
    });
  }
}
