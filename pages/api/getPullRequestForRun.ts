import type { NextApiRequest, NextApiResponse } from "next";

import { getPullRequestForRun } from "../../lib/server/supabase/tables/PullRequests";
import { PullRequest, RunId } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./constants";
import { sendApiMissingParametersResponse, sendApiResponse } from "./utils";

export type RequestParams = {
  runId: string;
};
export type ResponseData = PullRequest;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { runId } = request.query as RequestParams;
  if (!runId) {
    return sendApiMissingParametersResponse(response, {
      runId,
    });
  }

  try {
    const data = await getPullRequestForRun(
      parseInt(runId) as unknown as RunId
    );
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
