import type { NextApiRequest, NextApiResponse } from "next";

import { getBranchForId } from "../../lib/server/supabase/tables/Branches";
import { Branch, BranchId } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./constants";
import { sendApiMissingParametersResponse, sendApiResponse } from "./utils";

export type RequestParams = {
  branchId: BranchId;
};
export type ResponseData = Branch;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { branchId: branchIdString } = request.query as RequestParams;
  if (!branchIdString) {
    return sendApiMissingParametersResponse(request, response, {
      branchId: branchIdString,
    });
  }

  const branchId = parseInt(branchIdString) as unknown as BranchId;

  try {
    const data = await getBranchForId(branchId);
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
