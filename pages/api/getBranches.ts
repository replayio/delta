import type { NextApiRequest, NextApiResponse } from "next";

import { getBranchesForProject } from "../../lib/server/supabase/tables/Branches";
import { Branch, ProjectId } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./constants";
import { sendApiMissingParametersResponse, sendApiResponse } from "./utils";

export type RequestParams = {
  projectId: ProjectId;
  status?: "open" | "closed";
};
export type ResponseData = Branch[];

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { projectId: projectIdString, status = "open" } =
    request.query as RequestParams;
  if (!projectIdString) {
    return sendApiMissingParametersResponse(response, {
      projectId: projectIdString,
    });
  }

  const projectId = parseInt(projectIdString) as unknown as ProjectId;

  try {
    const data = await getBranchesForProject(projectId, status);
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
