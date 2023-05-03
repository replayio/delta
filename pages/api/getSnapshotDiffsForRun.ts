import type { NextApiRequest, NextApiResponse } from "next";

import diffSnapshots from "../../lib/server/diffSnapshots";
import { findProjectForRun } from "../../lib/server/supabase/functions/findProjectForRun";
import { latestSnapshotsForPrimaryBranch } from "../../lib/server/supabase/functions/latestSnapshotsForPrimaryBranch";
import { snapshotsForGithubRun } from "../../lib/server/supabase/functions/snapshotsForGithubRun";
import { getRunForId } from "../../lib/server/supabase/tables/Runs";
import { SnapshotDiff } from "../../lib/server/types";
import { RunId } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./constants";
import { sendApiMissingParametersResponse, sendApiResponse } from "./utils";

export type RequestParams = {
  runId: RunId;
};
export type ResponseData = SnapshotDiff[];

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const { runId } = request.query as RequestParams;
  if (!runId) {
    return sendApiMissingParametersResponse(response, {
      runId,
    });
  }

  try {
    const run = await getRunForId(runId);
    const project = await findProjectForRun(run.id);

    const oldSnapshots = await latestSnapshotsForPrimaryBranch(project.id);
    const newSnapshots = await snapshotsForGithubRun(run.github_run_id);

    const data = await diffSnapshots(oldSnapshots, newSnapshots);

    return sendApiResponse<ResponseData>(response, {
      httpStatusCode: HTTP_STATUS_CODES.OK,
      data,
    });
  } catch (error) {
    return sendApiResponse(response, {
      data: error,
      deltaErrorCode: DELTA_ERROR_CODE.STORAGE.DOWNLOAD_FAILED,
      httpStatusCode: HTTP_STATUS_CODES.NOT_FOUND,
    });
  }
}
