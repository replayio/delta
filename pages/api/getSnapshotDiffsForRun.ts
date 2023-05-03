import type { NextApiRequest, NextApiResponse } from "next";

import diffSnapshots from "../../lib/server/diffSnapshots";
import { getPrimaryBranchForProject } from "../../lib/server/supabase/tables/Branches";
import { getProjectForRun } from "../../lib/server/supabase/tables/Projects";
import {
  getMostRecentRunForBranch,
  getRunForId,
} from "../../lib/server/supabase/tables/Runs";
import { getSnapshotsForGithubRun } from "../../lib/server/supabase/tables/Snapshots";
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
    const project = await getProjectForRun(run.id);

    const primaryBranch = await getPrimaryBranchForProject(project);
    const primaryBranchRun = await getMostRecentRunForBranch(primaryBranch.id);

    const oldSnapshots = await getSnapshotsForGithubRun(primaryBranchRun.id);
    const newSnapshots = await getSnapshotsForGithubRun(run.github_run_id);

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
