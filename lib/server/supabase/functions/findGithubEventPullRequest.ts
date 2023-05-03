/*
  create or replace function find_github_event_pull_request(
    organization varchar,
    repository varchar,
    github_pr_number int2
  )

  returns record language sql as $$

  SELECT *
  FROM pull_requests
  WHERE github_pr_number = github_pr_number
    AND branch_id = (
    SELECT id
    FROM branches
    WHERE project_id = (
      SELECT id
      FROM projects
      WHERE organization = organization
        AND repository = repository
      LIMIT 1
    )
    LIMIT 1
  )
  LIMIT 1;

  $$;
*/

import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { PullRequest } from "../../../types";
import { assertQuerySingleResponse, supabase } from "../supabase";

export async function findGithubEventPullRequest(
  organization: string,
  repository: string,
  pullRequestNumber: number
) {
  return assertQuerySingleResponse<PullRequest>(
    () =>
      supabase.rpc("find_github_event_pull_request", {
        organization,
        repository,
        pull_request_number: pullRequestNumber,
      }) as PromiseLike<PostgrestSingleResponse<PullRequest>>,
    `PullRequest record not found for organization "${organization}", repository "${repository}", and PR number "${pullRequestNumber}"`
  );
}
