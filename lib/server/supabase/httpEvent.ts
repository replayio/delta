import { PostgrestSingleResponse } from "@supabase/supabase-js";
import createClient from "../../initServerSupabase";
import { safeStringify } from "../json";
import { retryOnError } from "./supabase";

export const supabase = createClient();

export type HTTPMetadata = {
  id: number;
  event_type: string;
  action: string;
  payload: Object;
  pr_number?: string;
  head_sha: string;
  branch_name?: string;
  job_id?: string;
  run_id?: string;
  check: Object;
  comment: Object;
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
  projectId: string,
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
