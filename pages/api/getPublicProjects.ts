import type { NextApiRequest, NextApiResponse } from "next";

import { getPublicProjects } from "../../lib/server/supabase/tables/Projects";
import { Project } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./constants";
import { sendApiResponse } from "./utils";

export type RequestParams = {};
export type ResponseData = Project[];

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  try {
    const data = await getPublicProjects();
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
