import type { NextApiRequest, NextApiResponse } from "next";

import { getBranchByName } from "../../lib/server/supabase/branches";
import { Branch } from "../../lib/types";
import {
  GenericResponse,
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
    return sendErrorResponse(response, 'Parameter "branch" is required');
  }

  const { data, error } = await getBranchByName(name);
  if (error) {
    return sendErrorResponseFromPostgrestError(response, error);
  } else if (!data) {
    return sendErrorResponse(
      response,
      `No branch found with name "${name}"`,
      404
    );
  } else {
    return sendResponse<ResponseData>(response, data);
  }
}
