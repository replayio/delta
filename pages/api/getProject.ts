import type { NextApiRequest, NextApiResponse } from "next";

import { postgrestErrorToError } from "../../lib/server/supabase/errors";
import {
  getProject,
  getProjectByShort,
  Project,
} from "../../lib/server/supabase/supabase";
import { ErrorResponse, GenericResponse, SuccessResponse } from "./types";

type ResponseData = Project;

export type Response = GenericResponse<ResponseData>;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { projectId, projectShort } = request.query;

  const { data, error } = await (projectId
    ? getProject(projectId as string)
    : getProjectByShort(projectShort as string));

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
