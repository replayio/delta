import { PostgrestSingleResponse } from "@supabase/supabase-js";
import createClient from "../../initServerSupabase";
import { JobId, ProjectId, RunId } from "../../types";
import { safeStringify } from "../json";
import { retryOnError } from "./supabase";

export const supabase = createClient();

export type HTTPMetadata = {
  action: string;
  branch_name?: string;
  check: Object;
  comment: Object;
  event_type: string;
  head_sha: string;
  id: number;
  job_id?: JobId;
  payload: Object;
  pr_number?: string;
  run_id?: RunId;
};

export async function insertHTTPMetadata(
  event: Partial<HTTPMetadata>
): Promise<PostgrestSingleResponse<HTTPMetadata>> {
  return retryOnError(() =>
    supabase.from("GithubEvent").insert(event).single()
  );
}

export async function updateHTTPMetadata(
  httpMetadata: HTTPMetadata,
  event: Partial<HTTPMetadata>
): Promise<PostgrestSingleResponse<HTTPMetadata>> {
  return retryOnError(() =>
    supabase
      .from("GithubEvent")
      .update(event)
      .eq("id", httpMetadata.id)
      .single()
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
