import type { NextApiRequest, NextApiResponse } from "next";

import { getBranchForId } from "../../lib/server/supabase/tables/Branches";
import { Branch, BranchId } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./constants";
import { sendApiMissingParametersResponse, sendApiResponse } from "./utils";

export type RequestParams = {
  id: BranchId;
};
export type ResponseData = Branch;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { id } = request.query as RequestParams;
  if (!id) {
    return sendApiMissingParametersResponse(response, { id });
  }

  try {
    const data = await getBranchForId(id);
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