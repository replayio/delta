import type { NextApiRequest, NextApiResponse } from "next";

import {
  getProject,
  getProjectForShort,
} from "../../lib/server/supabase/projects";
import { Project, ProjectId, ProjectShort } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./statusCodes";
import {
  GenericResponse,
  sendErrorMissingParametersResponse,
  sendErrorResponse,
  sendErrorResponseFromPostgrestError,
  sendResponse,
} from "./utils";

export type RequestParams = {
  projectId: ProjectId | null;
  projectShort: ProjectShort | null;
};
export type ResponseData = Project;
export type Response = GenericResponse<ResponseData>;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { projectId, projectShort } = request.query as RequestParams;
  if (!projectId && !projectShort) {
    return sendErrorMissingParametersResponse(response, {
      projectId,
      projectShort,
    });
  }

  const { data, error } = await (projectId
    ? getProject(projectId)
    : getProjectForShort(projectShort!));

  if (error) {
    sendErrorResponseFromPostgrestError(
      response,
      error,
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
      `No Project found for id "${projectId}" or short id "${projectShort}"`
    );
  } else if (!data) {
    return sendErrorResponse(
      response,
      `No Project found for id "${projectId}" or short id "${projectShort}"`,
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED
    );
  } else {
    return sendResponse<ResponseData>(response, data);
  }
}
