import { ErrorLog } from "../../../types";
import { supabase } from "../../initSupabase";
import { assertQuerySingleResponse } from "../supabase";

export async function insertErrorLog(
  errorLog: Omit<ErrorLog, "created_at" | "id">
) {
  return assertQuerySingleResponse<ErrorLog>(
    () => supabase.from("error_logs").insert(errorLog).single(),
    `Could not insert ErrorLog`
  );
}
