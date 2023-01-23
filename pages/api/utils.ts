import { PostgrestError } from "@supabase/supabase-js";
import { NextApiResponse } from "next";

export type ErrorWithCode = {
  message: string;
};

export type ErrorResponse = { error: ErrorWithCode };
export type SuccessResponse<ResponseData> = { data: ResponseData };
export type GenericResponse<ResponseData> =
  | ErrorResponse
  | SuccessResponse<ResponseData>;

export function isErrorResponse(
  response: GenericResponse<any>
): response is ErrorResponse {
  return "error" in response;
}

export function isSuccessResponse<ResponseData>(
  response: GenericResponse<ResponseData>
): response is SuccessResponse<ResponseData> {
  return "data" in response;
}

export function sendErrorResponse(
  response: NextApiResponse,
  message: string,
  statusCode: number = 500
): void {
  const json: ErrorResponse = {
    error: {
      message,
    },
  };

  response.setHeader("Content-Type", "application/json");
  response.status(statusCode);
  response.json(json);
}

export function sendErrorResponseFromPostgrestError(
  response: NextApiResponse,
  postgrestError: PostgrestError,
  statusCode: number = 500
): void {
  const json: ErrorResponse = {
    error: {
      message: `Error ${postgrestError.code}: ${postgrestError.message}\n${postgrestError.details}`,
    },
  };

  response.setHeader("Content-Type", "application/json");
  response.status(statusCode);
  response.json(json);
}

export function sendResponse<ResponseData>(
  response: NextApiResponse,
  data: ResponseData,
  statusCode: number = 200
) {
  response.setHeader("Content-Type", "application/json");
  response.status(statusCode);
  response.json({ data });
}
