import { GithubEventId, GithubEventType, ProjectId } from "../../../types";
import { safeStringify } from "../../json";
import { retryOnError, supabase } from "../supabase";

export async function insertHTTPEvent({
  data,
  githubEventId,
  githubEventType,
  projectId,
}: {
  data: Object;
  githubEventId: GithubEventId;
  githubEventType: GithubEventType;
  projectId: ProjectId;
}) {
  const path = `${projectId}/${githubEventId}-${githubEventType}.json`;
  const stringified = safeStringify(data, 2);

  return retryOnError(() =>
    supabase.storage.from("http-events").upload(path, stringified, {
      contentType: "application/json",
    })
  );
}
