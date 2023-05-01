import { GithubEventId, ProjectId } from "../../types";
import { safeStringify } from "../json";
import { retryOnError, supabase } from "./supabase";

export async function insertHTTPEvent(
  githubEventId: GithubEventId,
  projectId: ProjectId,
  data: any
) {
  const path = `${projectId}/${githubEventId}.json`;
  const stringified = safeStringify(data, 2);

  return retryOnError(() =>
    supabase.storage.from("http-events").upload(path, stringified, {
      contentType: "application/json",
    })
  );
}
