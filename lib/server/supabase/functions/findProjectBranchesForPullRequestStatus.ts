/*
  create or replace function find_project_branches_for_pull_request_status(
    project_id uuid,
    status varchar
  )

  returns setof record language sql as $$

  SELECT DISTINCT branches.*
    FROM branches
    WHERE project_id = project_id
      AND id = (
        SELECT branch_id
        FROM pull_requests
        WHERE github_status = status
      )

  $$;
*/

import { Branch, ProjectId, PullRequestStatus } from "../../../types";
import { assertQueryResponse, supabase } from "../supabase";

// TODO Delete this in favor of getBranchesForProject() once it's been confirmed to work.
export async function findProjectBranchesForPullRequestStatus(
  projectId: ProjectId,
  status: PullRequestStatus
) {
  return assertQueryResponse<Branch>(
    () =>
      supabase.rpc("find_project_branches_for_pull_request_status", {
        project_id: projectId,
        status,
      }),
    `Could not find Branches for Project "${projectId}"`
  );
}
