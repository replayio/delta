import { ErrorLog } from "../../../types";
import { assertQuerySingleResponse, supabase } from "../supabase";

export async function insertErrorLog(
  errorLog: Omit<ErrorLog, "created_at" | "id">
) {
  return assertQuerySingleResponse<ErrorLog>(
    () => supabase.from("error_logs").insert(errorLog).single(),
    `Could not insert ErrorLog`
  );
}
