/*
  create or replace function latest_snapshot_for_primary_branch(
    project_id uuid,
    file varchar
  )

  returns record language sql as $$

  SELECT *
  FROM snapshot
  WHERE run_id = (
    SELECT id
    FROM runs
    WHERE file = file
      AND branch_id = (
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
  )
  LIMIT 1;

  $$;
*/

import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { ProjectId, Snapshot } from "../../../types";
import { assertQuerySingleResponse, supabase } from "../supabase";

// TODO Delete this in favor of getMostRecentSnapshotForBranchAndFile() once it's been confirmed to work.
export async function latestSnapshotForPrimaryBranch(
  projectId: ProjectId,
  file: string
) {
  return assertQuerySingleResponse<Snapshot>(
    () =>
      supabase.rpc("latest_snapshot_for_primary_branch", {
        project_id: projectId,
        file,
      }) as PromiseLike<PostgrestSingleResponse<Snapshot>>,
    `Could not find latest snapshot for primary branch of Project "${projectId}"`
  );
}
