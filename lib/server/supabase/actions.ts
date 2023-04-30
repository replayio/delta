import {
  PostgrestResponse,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";
import { Action, ActionId, JobId } from "../../types";
import { retryOnError, supabase } from "./supabase";

export async function getAction(
  actionId: ActionId
): Promise<PostgrestSingleResponse<Action>> {
  return retryOnError(() =>
    supabase.from("Actions").select("*").eq("id", actionId).single()
  );
}

export async function getActionsForJob(
  jobId: JobId
): Promise<PostgrestResponse<Action>> {
  return retryOnError(() =>
    supabase
      .from("Actions")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false })
  );
}

export async function updateAction(
  actionId: ActionId,
  action: Partial<Action>
): Promise<PostgrestSingleResponse<Action>> {
  return retryOnError(() =>
    supabase.from("Actions").update(action).eq("id", actionId).single()
  );
}
