import type { NextApiRequest, NextApiResponse } from "next";

import { getPublicProjects } from "../../lib/server/supabase/projects";
import { Project } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./statusCodes";
import {
  GenericResponse,
  sendErrorResponseFromPostgrestError,
  sendResponse,
} from "./utils";

export type RequestParams = {};
export type ResponseData = Project[];
export type Response = GenericResponse<ResponseData>;

export default async function handler(
  _request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { data, error } = await getPublicProjects();
  if (error) {
    return sendErrorResponseFromPostgrestError(
      response,
      error,
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
      `No public Projects found`
    );
  } else {
    return sendResponse<ResponseData>(response, data);
  }
}
