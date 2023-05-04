import { GithubEvent } from "../../../types";
import { supabase } from "../../initSupabase";
import { assertQuerySingleResponse } from "../supabase";

export async function insertGithubEvent(
  event: Omit<GithubEvent, "created_at" | "id">
) {
  return assertQuerySingleResponse<GithubEvent>(
    () => supabase.from("github_events").insert(event).single(),
    `Could not insert GithubEvent`
  );
}
