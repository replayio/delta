import ErrorStackParser from "error-stack-parser";

import { DeltaErrorCode, HttpStatusCode } from "../../../pages/api/statusCodes";
import { retryOnError, supabase } from "./supabase";
import { Error as ErrorRow } from "../../types";

export async function insertError({
  deltaErrorCode,
  error,
  httpStatusCode,
}: {
  deltaErrorCode: DeltaErrorCode;
  error: Error;
  httpStatusCode: HttpStatusCode;
}) {
  const parsed = ErrorStackParser.parse(error);

  const value: Omit<ErrorRow, "created_at" | "id"> = {
    delta_error_code: deltaErrorCode.code,
    error_message: error.message,
    parsed_error_stack: parsed,
    http_status_code: httpStatusCode.code,
  };

  return retryOnError(() => supabase.from("Errors").insert(value).single());
}
