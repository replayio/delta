/*
  create or replace function latest_snapshots_for_primary_branch(
    project_id uuid
  )

  returns setof record language sql as $$

  SELECT *
  FROM snapshots
  WHERE run_id = (
    SELECT id
    FROM runs
    WHERE branch_id = (
      SELECT id
      FROM branches
        WHERE project_id = project_id
          AND status = 'open'
          AND organization = (
            SELECT organization
            FROM projects
            WHERE id = project_id
          )
          AND name = (
            SELECT primary_branch
            FROM projects
            WHERE id = project_id
          )
        ORDER BY created_at DESC
        LIMIT 1
    )
    ORDER BY created_at DESC
    LIMIT 1
  );

  $$;
*/

import { ProjectId, Snapshot } from "../../../types";
import { assertQueryResponse, supabase } from "../supabase";

export async function latestSnapshotsForPrimaryBranch(projectId: ProjectId) {
  return assertQueryResponse<Snapshot>(
    () =>
      supabase.rpc("latest_snapshots_for_primary_branch", {
        project_id: projectId,
      }),
    `Could not find latest snapshots for primary branch of Project "${projectId}"`
  );
}
