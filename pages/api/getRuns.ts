import type { NextApiRequest, NextApiResponse } from "next";

import { getRunsForBranch } from "../../lib/server/supabase/tables/Runs";
import { BranchId, Run } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./constants";
import { sendApiMissingParametersResponse, sendApiResponse } from "./utils";

export type RequestParams = {
  branchId: BranchId;
  limit?: string;
};
export type ResponseData = Run[];

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { branchId, limit } = request.query as RequestParams;
  if (!branchId) {
    return sendApiMissingParametersResponse(response, { branchId });
  }

  try {
    const runs = await getRunsForBranch(
      branchId,
      limit ? parseInt(limit) : undefined
    );

    return sendApiResponse<ResponseData>(response, {
      data: runs,
      httpStatusCode: HTTP_STATUS_CODES.OK,
    });
  } catch (error) {
    return sendApiResponse(response, {
      data: error,
      deltaErrorCode: DELTA_ERROR_CODE.STORAGE.DOWNLOAD_FAILED,
      httpStatusCode: HTTP_STATUS_CODES.NOT_FOUND,
    });
  }
}
