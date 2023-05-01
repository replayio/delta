import type { NextApiRequest, NextApiResponse } from "next";

import { getBranchByName } from "../../lib/server/supabase/branches";
import { Branch } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./statusCodes";
import {
  GenericResponse,
  sendErrorMissingParametersResponse,
  sendErrorResponse,
  sendErrorResponseFromPostgrestError,
  sendResponse,
} from "./utils";

export type RequestParams = {
  name: string;
};
export type ResponseData = Branch;
export type Response = GenericResponse<ResponseData>;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { name } = request.query as RequestParams;
  if (name == null) {
    return sendErrorMissingParametersResponse(response, { name });
  }

  const { data, error } = await getBranchByName(name);
  if (error) {
    return sendErrorResponseFromPostgrestError(
      response,
      error,
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
      `No Branch found with name "${name}"`
    );
  } else if (!data) {
    return sendErrorResponse(
      response,
      `No branch found with name "${name}"`,
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED
    );
  } else {
    return sendResponse<ResponseData>(response, data);
  }
}
