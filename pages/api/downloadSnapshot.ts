import type { NextApiRequest, NextApiResponse } from "next";

import { downloadSnapshot } from "../../lib/server/supabase/storage/Snapshots";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./constants";
import { sendApiMissingParametersResponse, sendApiResponse } from "./utils";

export type RequestParams = {
  path: string;
};
export type ResponseData = string;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { path } = request.query as RequestParams;
  if (!path) {
    return sendApiMissingParametersResponse(request, response, { path });
  }

  try {
    const data = await downloadSnapshot(path);
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
