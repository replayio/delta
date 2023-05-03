import { DeltaErrorCode, HttpStatusCode } from "./constants";

export type ApiErrorResponse = {
  data: Error;
  deltaErrorCode: DeltaErrorCode;
  httpStatusCode: HttpStatusCode;
};

export type ApiSuccessResponse<Type = unknown> = {
  data: Type;
  httpStatusCode: HttpStatusCode;
};

export type ApiResponse<Type = unknown> =
  | ApiErrorResponse
  | ApiSuccessResponse<Type>;
