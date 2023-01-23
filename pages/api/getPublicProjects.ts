import type { NextApiRequest, NextApiResponse } from "next";

import { postgrestErrorToError } from "../../lib/server/supabase/errors";
import { getPublicProjects, Project } from "../../lib/server/supabase/supabase";
import { ErrorResponse, GenericResponse, SuccessResponse } from "./types";

type ResponseData = Project[];

export type Response = GenericResponse<ResponseData>;

export default async function handler(
  _request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { data, error } = await getPublicProjects();

  if (error) {
    return response.status(500).json({
      error: postgrestErrorToError(error),
    } as ErrorResponse);
  } else {
    return response
      .status(200)
      .json({ data: data! } as SuccessResponse<ResponseData>);
  }
}
