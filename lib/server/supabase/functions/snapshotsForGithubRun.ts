/*
  create or replace function snapshots_for_github_run(
    github_run_id varchar
  )

  returns setof record language sql as $$

  SELECT snapshots.*
  FROM snapshots
    INNER JOIN "Runs" runs ON snapshots.run_id = runs.id
  WHERE runs.github_run_id = github_run_id
  ORDER BY snapshots.path ASC;

  $$;
*/

import { GithubRunId, Snapshot } from "../../../types";
import { assertQueryResponse, supabase } from "../supabase";

export async function snapshotsForGithubRun(githubRunId: GithubRunId) {
  return assertQueryResponse<Snapshot>(
    () =>
      supabase.rpc("snapshots_for_github_run", { github_run_id: githubRunId }),
    `Could not find snapshots for Github run "${githubRunId}"`
  );
}
