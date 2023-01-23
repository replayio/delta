import type { NextApiRequest, NextApiResponse } from "next";

import { postgrestErrorToError } from "../../lib/server/supabase/errors";
import {
  getProject,
  getProjectByShort,
  Project,
} from "../../lib/server/supabase/supabase";
import { ErrorResponse, GenericResponse, SuccessResponse } from "./types";

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
    return response.status(422).json({
      error: new Error(
        'Must specify either "projectId" or "projectShort" param'
      ),
    } as ErrorResponse);
  }

  const { data, error } = await (projectId
    ? getProject(projectId)
    : getProjectByShort(projectShort!));

  if (error) {
    return response.status(500).json({
      error: postgrestErrorToError(error),
    } as ErrorResponse);
  } else if (!data) {
    return response.status(404).json({
      error: new Error(`No project found for "${projectId || projectShort}"`),
    } as ErrorResponse);
  } else {
    return response.status(200).json({ data } as SuccessResponse<ResponseData>);
  }
}
