import { PostgrestError } from "@supabase/supabase-js";
import { NextApiResponse } from "next";

export type ErrorLike = {
  message: string;
  [key: string]: string | number | boolean;
};

export type ErrorResponse = { error: ErrorLike | { message: string } };
export type SuccessResponse<ResponseData> = { data: ResponseData };
export type GenericResponse<ResponseData> =
  | ErrorResponse
  | SuccessResponse<ResponseData>;

export function createErrorMessageFromPostgrestError(
  postgrestError: PostgrestError
): string {
  return `Error code ${postgrestError.code}: ${postgrestError.message}\n\n${postgrestError.details}`;
}

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
  error: ErrorLike | string,
  statusCode: number = 500
): void {
  const json: ErrorResponse = {
    error: typeof error === "string" ? { message: error } : error,
  };

  response.setHeader("Content-Type", "application/json");
  response.status(statusCode);
  response.json(json);
}

export function sendErrorMissingParametersResponse(
  response: NextApiResponse,
  params: Object
): void {
  const missingParamNames = Array.from(Object.keys(params)).filter(
    (key) => !params[key]
  );
  const message =
    missingParamNames.length > 1
      ? `Missing required params "${missingParamNames.join('", "')}"`
      : `Missing required param "${missingParamNames[0]}"`;
  const details = JSON.stringify(params, null, 2);
  return sendErrorResponse(response, `${message}\n\n${details}}`, 422);
}

export function sendErrorResponseFromPostgrestError(
  response: NextApiResponse,
  postgrestError: PostgrestError,
  statusCode: number = 500
): void {
  const json: ErrorResponse = {
    error: {
      message: createErrorMessageFromPostgrestError(postgrestError),
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
