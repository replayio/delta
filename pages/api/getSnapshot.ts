import type { NextApiRequest, NextApiResponse } from "next";

import { downloadSnapshot } from "../../lib/server/supabase/storage";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./statusCodes";
import {
  GenericResponse,
  sendErrorMissingParametersResponse,
  sendErrorResponse,
  sendResponse,
} from "./utils";

export type RequestParams = {
  path: string;
};
export type ResponseData = string;
export type Response = GenericResponse<ResponseData>;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { path } = request.query as RequestParams;
  if (!path) {
    return sendErrorMissingParametersResponse(response, { path });
  }

  const { data, error } = await downloadSnapshot(path);
  if (error) {
    return sendErrorResponse(
      response,
      error.message,
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.STORAGE.DOWNLOAD_FAILED,
      `No Snapshot data found for path "${path}"`
    );
  } else if (!data) {
    return sendErrorResponse(
      response,
      `No Snapshot data found for path "${path}"`,
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.STORAGE.DOWNLOAD_FAILED
    );
  } else {
    return sendResponse<ResponseData>(response, data);
  }
}
