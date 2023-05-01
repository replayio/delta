import { PostgrestError } from "@supabase/supabase-js";
import { NextApiResponse } from "next";
import { insertError } from "../../lib/server/supabase/errors";
import {
  DELTA_ERROR_CODE,
  DeltaErrorCode,
  HTTP_STATUS_CODES,
  HttpStatusCode,
} from "./statusCodes";
import { error } from "console";

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
  errorLike: ErrorLike | string,
  httpStatusCode: HttpStatusCode,
  deltaErrorCode: DeltaErrorCode,
  messagePrefix?: string
): void {
  let errorMessage =
    typeof errorLike === "string" ? errorLike : errorLike.message;
  if (messagePrefix) {
    errorMessage = `${messagePrefix}\n\n${errorMessage}`;
  }
  errorMessage = `${deltaErrorCode.code}: ${errorMessage}`;

  const error =
    errorLike instanceof Error ? errorLike : new Error(errorMessage);

  response.setHeader("Content-Type", "application/json");
  response.status(httpStatusCode.code);
  response.json({ error: errorMessage });

  try {
    insertError({
      deltaErrorCode,
      error,
      httpStatusCode,
    });
  } catch (error) {
    console.error(error);
    // Fire and forget
  }
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
  return sendErrorResponse(
    response,
    `${message}\n\n${details}}`,
    HTTP_STATUS_CODES.BAD_REQUEST,
    DELTA_ERROR_CODE.MISSING_PARAMETERS
  );
}

export function sendErrorResponseFromPostgrestError(
  response: NextApiResponse,
  postgrestError: PostgrestError,
  httpStatusCode: HttpStatusCode,
  deltaErrorCode: DeltaErrorCode,
  messagePrefix?: string
): void {
  let errorMessage = createErrorMessageFromPostgrestError(postgrestError);
  if (messagePrefix) {
    errorMessage = `${messagePrefix}\n\n${errorMessage}`;
  }
  errorMessage = `${deltaErrorCode.code}: ${errorMessage}`;

  const error = new Error(errorMessage);

  response.setHeader("Content-Type", "application/json");
  response.status(httpStatusCode.code);
  response.json({ error: errorMessage });

  try {
    insertError({
      deltaErrorCode,
      error,
      httpStatusCode,
    });
  } catch (error) {
    console.error(error);
    // Fire and forget
  }
}

export function sendResponse<ResponseData>(
  response: NextApiResponse,
  data: ResponseData,
  httpStatusCode: HttpStatusCode = HTTP_STATUS_CODES.OK
) {
  response.setHeader("Content-Type", "application/json");
  response.status(httpStatusCode.code);
  response.json({ data });
}
