import type { NextApiRequest, NextApiResponse } from "next";

import {
  getProject,
  getProjectByShort,
  Project,
} from "../../lib/server/supabase/supabase";
import {
  GenericResponse,
  sendErrorMissingParametersResponse,
  sendErrorResponse,
  sendErrorResponseFromPostgrestError,
  sendResponse,
} from "./utils";

export type RequestParams = {
  projectId: string | null;
  projectShort: string | null;
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
    : getProjectByShort(projectShort!));

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
