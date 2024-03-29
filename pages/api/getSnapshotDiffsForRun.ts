import type { NextApiRequest, NextApiResponse } from "next";

import { computeSnapshotDiffs } from "../../lib/server/computeSnapshotDiffs";
import { getPrimaryBranchForProject } from "../../lib/server/supabase/tables/Branches";
import { getProjectForRun } from "../../lib/server/supabase/tables/Projects";
import {
  getMostRecentSuccessfulRunForBranch,
  getRunForId,
} from "../../lib/server/supabase/tables/Runs";
import { getSnapshotAndSnapshotVariantsForRun } from "../../lib/server/supabase/utils/getSnapshotAndSnapshotVariantsForRun";
import { SnapshotDiff } from "../../lib/server/types";
import { RunId } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./constants";
import { sendApiMissingParametersResponse, sendApiResponse } from "./utils";

export type RequestParams = {
  runId: string;
};
export type ResponseData = SnapshotDiff[];

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
    const primaryBranchRun = await getMostRecentSuccessfulRunForBranch(
      primaryBranch.id
    );

    const oldSnapshotAndSnapshotVariants = primaryBranchRun
      ? await getSnapshotAndSnapshotVariantsForRun(primaryBranchRun.id)
      : [];
    const newSnapshotAndSnapshotVariants =
      await getSnapshotAndSnapshotVariantsForRun(run.id);

    const data = await computeSnapshotDiffs(
      oldSnapshotAndSnapshotVariants,
      newSnapshotAndSnapshotVariants
    );

    return sendApiResponse<ResponseData>(request, response, {
      httpStatusCode: HTTP_STATUS_CODES.OK,
      data,
    });
  } catch (error) {
    return sendApiResponse(request, response, {
      data: error,
      deltaErrorCode: DELTA_ERROR_CODE.STORAGE.DOWNLOAD_FAILED,
      httpStatusCode: HTTP_STATUS_CODES.NOT_FOUND,
    });
  }
}
