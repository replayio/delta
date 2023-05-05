import type { NextApiRequest, NextApiResponse } from "next";

import {
  getProjectForId,
  getProjectForSlug,
} from "../../lib/server/supabase/tables/Projects";
import { Project, ProjectId, ProjectSlug } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./constants";
import { sendApiMissingParametersResponse, sendApiResponse } from "./utils";

export type RequestParams = {
  projectId?: ProjectId | null;
  projectSlug?: ProjectSlug | null;
};
export type ResponseData = Project;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { projectId, projectSlug } = request.query as RequestParams;
  if (!projectId && !projectSlug) {
    return sendApiMissingParametersResponse(request, response, {
      projectId,
      projectSlug,
    });
  }

  try {
    const data = projectId
      ? await getProjectForId(projectId)
      : await getProjectForSlug(projectSlug!);

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
