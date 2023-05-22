import type { NextApiRequest, NextApiResponse } from "next";

import { getBranchesForProject } from "../../lib/server/supabase/tables/Branches";
import { Branch, ProjectId } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./constants";
import { sendApiMissingParametersResponse, sendApiResponse } from "./utils";

export type RequestParams = {
  limit?: string;
  projectId: ProjectId;
};
export type ResponseData = Branch[];

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { limit: limitString = "20", projectId: projectIdString } =
    request.query as RequestParams;
  if (!projectIdString) {
    return sendApiMissingParametersResponse(request, response, {
      projectId: projectIdString,
    });
  }

  const limit = parseInt(limitString);
  const projectId = parseInt(projectIdString) as unknown as ProjectId;

  try {
    const openBranches = await getBranchesForProject(projectId, true, limit);

    let closedBranches: Branch[] = [];
    if (openBranches.length < limit) {
      closedBranches = await getBranchesForProject(
        projectId,
        false,
        limit - openBranches.length
      );
    }

    return sendApiResponse<ResponseData>(request, response, {
      httpStatusCode: HTTP_STATUS_CODES.OK,
      data: [...openBranches, ...closedBranches],
    });
  } catch (error) {
    return sendApiResponse(request, response, {
      data: error,
      deltaErrorCode: DELTA_ERROR_CODE.STORAGE.DOWNLOAD_FAILED,
      httpStatusCode: HTTP_STATUS_CODES.NOT_FOUND,
    });
  }
}
