import type { NextApiRequest, NextApiResponse } from "next";

import getSnapshotDiffCount from "../../lib/server/getSnapshotDiffCount";
import { getPrimaryBranchForProject } from "../../lib/server/supabase/tables/Branches";
import { getProjectForRun } from "../../lib/server/supabase/tables/Projects";
import {
  getMostRecentRunForBranch,
  getRunForId,
} from "../../lib/server/supabase/tables/Runs";
import { getSnapshotsForRun } from "../../lib/server/supabase/tables/Snapshots";
import { RunId } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./constants";
import { sendApiMissingParametersResponse, sendApiResponse } from "./utils";

export type RequestParams = {
  runId: string;
};
export type ResponseData = number;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const { runId } = request.query as RequestParams;
  if (!runId) {
    return sendApiMissingParametersResponse(request, response, {
      runId,
    });
  }

  try {
    const run = await getRunForId(parseInt(runId) as unknown as RunId);
    const project = await getProjectForRun(run.id);

    const primaryBranch = await getPrimaryBranchForProject(project);
    const primaryBranchRun = await getMostRecentRunForBranch(primaryBranch.id);

    const oldSnapshots = primaryBranchRun
      ? await getSnapshotsForRun(primaryBranchRun.id)
      : [];
    const newSnapshots = await getSnapshotsForRun(run.id);

    const count = getSnapshotDiffCount(oldSnapshots, newSnapshots);

    return sendApiResponse<ResponseData>(request, response, {
      httpStatusCode: HTTP_STATUS_CODES.OK,
      data: count,
    });
  } catch (error) {
    return sendApiResponse(request, response, {
      data: error,
      deltaErrorCode: DELTA_ERROR_CODE.STORAGE.DOWNLOAD_FAILED,
      httpStatusCode: HTTP_STATUS_CODES.NOT_FOUND,
    });
  }
}