import type { NextApiRequest, NextApiResponse } from "next";

import { Project, ProjectId, ProjectShort } from "../../lib/types";
import {
  GenericResponse,
  sendErrorMissingParametersResponse,
  sendErrorResponse,
  sendErrorResponseFromPostgrestError,
  sendResponse,
} from "./utils";
import {
  getProject,
  getProjectForShort,
} from "../../lib/server/supabase/projects";

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
    sendErrorResponseFromPostgrestError(response, error);
  } else if (!data) {
    return sendErrorResponse(
      response,
      `No project found for "${projectId || projectShort}"`,
      404
    );
  } else {
    return sendResponse<ResponseData>(response, data);
  }
}
