import type { NextApiRequest, NextApiResponse } from "next";

import { downloadSnapshot } from "../../lib/server/supabase/storage";
import { ErrorResponse, GenericResponse, SuccessResponse } from "./types";

type ResponseData = Buffer;

export type Response = GenericResponse<ResponseData>;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { path } = request.query;
  if (!path) {
    return response.status(422).json({
      error: new Error('Missing required param "path"'),
    } as ErrorResponse);
  }

  const { data, error } = await downloadSnapshot(path as string);

  if (error) {
    return response.status(500).json({ error } as ErrorResponse);
  } else if (!data) {
    return response.status(404).json({
      error: new Error(`No snapshot found for path "${path}"`),
    } as ErrorResponse);
  } else {
    response.setHeader("Content-Type", "image/png");
    return response.status(200).send({
      data: Buffer.from(data, "base64"),
    } as SuccessResponse<ResponseData>);
  }
}
