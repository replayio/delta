import type { NextApiRequest, NextApiResponse } from "next";

import { downloadSnapshot } from "../../lib/server/supabase/storage";
import { GenericResponse, sendErrorResponse, sendResponse } from "./utils";

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
    return sendErrorResponse(response, 'Missing required param "path"', 422);
  }

  const { data, error } = await downloadSnapshot(path);
  if (error) {
    return sendErrorResponse(response, error.message);
  } else if (!data) {
    return sendErrorResponse(
      response,
      `No snapshot found for path "${path}"`,
      404
    );
  } else {
    return sendResponse<ResponseData>(response, data);
  }
}
