import { PostgrestError } from "@supabase/supabase-js";
import { NextApiRequest, NextApiResponse } from "next";
import { insertErrorLog } from "../../lib/server/supabase/tables/ErrorLogs";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./constants";
import { ApiErrorResponse, ApiResponse, ApiSuccessResponse } from "./types";

export function createErrorFromPostgrestError(
  postgrestError: PostgrestError,
  messagePrefix?: string
): Error {
  let message = `Error code ${postgrestError.code}: ${postgrestError.message}\n\n${postgrestError.details}`;
  if (messagePrefix) {
    message = `${messagePrefix}\n\n${message}`;
  }

  const error = Error(message);
  // @ts-ignore
  error.code = parseInt(postgrestError.code);
  // @ts-ignore
  error.details = postgrestError.details;

  return error;
}

export function isApiErrorResponse(
  response: ApiErrorResponse | ApiSuccessResponse
): response is ApiErrorResponse {
  return response && (response as Object).hasOwnProperty("deltaErrorCode");
}

export function isApiSuccessResponse(
  response: ApiErrorResponse | ApiSuccessResponse
): response is ApiSuccessResponse {
  return response && !(response as Object).hasOwnProperty("deltaErrorCode");
}

export async function sendApiMissingParametersResponse(
  nextApiRequest: NextApiRequest,
  nextApiResponse: NextApiResponse,
  parametersObject: Object
) {
  const missingParameters: string[] = [];
  for (const [key, value] of Object.entries(parametersObject)) {
    if (!value) {
      missingParameters.push(key);
    }
  }

  sendApiResponse(nextApiRequest, nextApiResponse, {
    data: new Error(
      `Missing required parameters: ${missingParameters.join(", ")}`
    ),
    deltaErrorCode: DELTA_ERROR_CODE.MISSING_PARAMETERS,
    httpStatusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  });
}

export async function sendApiResponse<Type = unknown>(
  nextApiRequest: NextApiRequest,
  nextApiResponse: NextApiResponse,
  apiResponse: ApiResponse<Type>
): Promise<void> {
  nextApiResponse.setHeader("Content-Type", "application/json");
  nextApiResponse.status(apiResponse.httpStatusCode.code);
  nextApiResponse.json({ data: apiResponse.data });

  if (isApiErrorResponse(apiResponse)) {
    try {
      // Fire and forget
      await insertErrorLog({
        delta_error_code: apiResponse.deltaErrorCode.code,
        http_status_code: apiResponse.httpStatusCode.code,
        message: apiResponse.data.message,
        request_body: nextApiRequest.body || null,
        request_headers: nextApiRequest.rawHeaders || null,
        request_method: nextApiRequest.method || null,
        request_url: nextApiRequest.url || null,
        stack: apiResponse.data.stack ?? null,
      });
    } catch (error) {
      console.error(error);
    }
  }
}
