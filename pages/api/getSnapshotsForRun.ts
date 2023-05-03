import type { NextApiRequest, NextApiResponse } from "next";

import { getSnapshotsForRun } from "../../lib/server/supabase/tables/Snapshots";
import { RunId, Snapshot } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./constants";
import { sendApiMissingParametersResponse, sendApiResponse } from "./utils";

export type RequestParams = {
  runId: RunId;
};
export type ResponseData = Snapshot[];

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { runId } = request.query as RequestParams;
  if (!runId) {
    return sendApiMissingParametersResponse(response, { runId });
  }

  try {
    const data = await getSnapshotsForRun(runId);

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
