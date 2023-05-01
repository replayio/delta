import { PostgrestSingleResponse } from "@supabase/supabase-js";
import createClient from "../../initServerSupabase";
import { GithubEvent } from "../../types";
import { retryOnError } from "./supabase";

export const supabase = createClient();

export async function insertGithubEvent(
  event: Partial<GithubEvent>
): Promise<PostgrestSingleResponse<GithubEvent>> {
  return retryOnError(() =>
    supabase.from("GithubEvents").insert(event).single()
  );
}

export async function updateGithubEvent(
  githubEvent: GithubEvent,
  event: Partial<GithubEvent>
): Promise<PostgrestSingleResponse<GithubEvent>> {
  return retryOnError(() =>
    supabase
      .from("GithubEvents")
      .update(event)
      .eq("id", githubEvent.id)
      .single()
  );
}
