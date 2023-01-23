import type { NextApiRequest, NextApiResponse } from "next";

import { getBranchByName } from "../../lib/server/supabase/branches";
import { postgrestErrorToError } from "../../lib/server/supabase/errors";
import { Branch } from "../../lib/server/supabase/supabase";
import { ErrorResponse, GenericResponse, SuccessResponse } from "./types";

type ResponseData = Branch;

export type Response = GenericResponse<ResponseData>;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { name } = request.query;
  if (name == null) {
    response.status(422).json({
      error: new Error('Parameter "branch" is required'),
    } as ErrorResponse);
  }

  const { data, error } = await getBranchByName(name as string);
  if (error) {
    return response.status(500).json({
      error: postgrestErrorToError(error),
    } as ErrorResponse);
  } else if (!data) {
    return response.status(404).json({
      error: new Error(`No branch found with name "${name}"`),
    } as ErrorResponse);
  } else {
    return response.status(200).json({ data } as SuccessResponse<ResponseData>);
  }
}
