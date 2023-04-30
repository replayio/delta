import { PostgrestSingleResponse } from "@supabase/supabase-js";
import createClient from "../../initServerSupabase";
import { GithubEvent, ProjectId } from "../../types";
import { safeStringify } from "../json";
import { retryOnError } from "./supabase";

export const supabase = createClient();

export async function insertGithubEvent(
  event: Partial<GithubEvent>
): Promise<PostgrestSingleResponse<GithubEvent>> {
  return retryOnError(() =>
    supabase.from("GithubEvent").insert(event).single()
  );
}

export async function updateGithubEvent(
  githubEvent: GithubEvent,
  event: Partial<GithubEvent>
): Promise<PostgrestSingleResponse<GithubEvent>> {
  return retryOnError(() =>
    supabase.from("GithubEvent").update(event).eq("id", githubEvent.id).single()
  );
}

export async function insertHTTPEvent(
  id: number,
  projectId: ProjectId,
  data: any
) {
  const path = `${projectId}/${id}.json`;
  const stringified = safeStringify(data, 2);

  return retryOnError(() =>
    supabase.storage.from("http-events").upload(path, stringified, {
      contentType: "application/json",
    })
  );
}
