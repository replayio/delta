import type { NextApiRequest, NextApiResponse } from "next";

import { downloadSnapshot } from "../../lib/server/supabase/storage";
import { ErrorResponse, GenericResponse, SuccessResponse } from "./types";

type ResponseData = string;

export type Response = GenericResponse<ResponseData>;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { path } = request.query;
  const { data, error } = await downloadSnapshot(path as string);

  if (error) {
    return response.status(500).json({ error } as ErrorResponse);
  } else if (!data) {
    return response.status(404).json({
      error: new Error(`No snapshot found for path "${path}"`),
    } as ErrorResponse);
  } else {
    return response.status(200).json({ data } as SuccessResponse<ResponseData>);
  }
}
