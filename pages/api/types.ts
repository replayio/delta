export type ErrorResponse = { error: Error };
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
