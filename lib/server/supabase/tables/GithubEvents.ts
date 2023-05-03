import createClient from "../../../initServerSupabase";
import { GithubEvent } from "../../../types";
import { assertQuerySingleResponse } from "../supabase";

export const supabase = createClient();

export async function insertGithubEvent(
  event: Omit<GithubEvent, "created_at" | "id">
) {
  return assertQuerySingleResponse<GithubEvent>(
    () => supabase.from("github_events").insert(event).single(),
    `Could not insert GithubEvent`
  );
}
