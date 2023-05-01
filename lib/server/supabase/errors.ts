import { Error } from "../../types";
import { retryOnError, supabase } from "./supabase";

export async function insertError(error: Omit<Error, "created_at" | "id">) {
  return retryOnError(() => supabase.from("Errors").insert(error).single());
}
