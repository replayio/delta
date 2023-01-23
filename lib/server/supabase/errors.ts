import { PostgrestError } from "@supabase/supabase-js";

class ErrorWithCode extends Error {
  code: string;
  details: string;
  hint: string;

  constructor(message: string, code: string, details: string, hint: string) {
    super(message);

    this.code = code;
    this.details = details;
    this.hint = hint;
  }
}

export function isPostgrestError(value: any): value is PostgrestError {
  return (
    value instanceof Object &&
    "code" in value &&
    "details" in value &&
    "hint" in value &&
    "message" in value
  );
}
