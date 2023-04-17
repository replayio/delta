import {
  PostgrestResponse,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";
import { Action, retryOnError, supabase } from "./supabase";

export async function getActionFromBranch(
  branch_id: string,
  runId?: string
): Promise<PostgrestSingleResponse<Action>> {
  let query = supabase.from("Actions").select("*").eq("branch_id", branch_id);
  if (runId) {
    query = query.eq("run_id", runId);
  }

  return retryOnError(() =>
    query.order("created_at", { ascending: false }).limit(1).single()
  );
}

export async function getActionFromRunId(
  run_id: string
): Promise<PostgrestSingleResponse<Action>> {
  return retryOnError(() =>
    supabase
      .from("Actions")
      .select("*")
      .eq("run_id", run_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
  );
}

export async function getActionsFromBranch(
  branch_id: string
): Promise<PostgrestResponse<Action>> {
  return retryOnError(() =>
    supabase
      .from("Actions")
      .select("*")
      .eq("branch_id", branch_id)
      .order("created_at", { ascending: false })
  );
}

export async function getAction(
  actionId: string
): Promise<PostgrestSingleResponse<Action>> {
  return retryOnError(() =>
    supabase.from("Actions").select("*").eq("id", actionId).single()
  );
}

export async function getMostRecentActionsFromProject(
  project_id: string,
  afterDate?: string
): Promise<PostgrestSingleResponse<Action[]>> {
  let query = supabase
    .from("Actions")
    .select("id, Branches ( name )")
    .eq("Branches.project_id", project_id)
    .gt("num_snapshots_changed", "0");

  if (afterDate) {
    query.gte("created_at", afterDate);
  }

  return retryOnError(() => query.limit(1000));
}

export async function updateAction(
  actionId: string,
  action: Partial<Action>
): Promise<PostgrestSingleResponse<Action>> {
  return retryOnError(() =>
    supabase.from("Actions").update(action).eq("id", actionId).single()
  );
}

export async function incrementActionNumSnapshots(action_id) {
  return retryOnError(() =>
    supabase.rpc("snapshots_inc", {
      action_id,
    })
  );
}
