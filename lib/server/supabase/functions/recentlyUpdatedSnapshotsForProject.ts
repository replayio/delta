/*
  create or replace function recently_updated_snapshots_for_project(
    project_id uuid,
    after_created_at date,
    max_limit numeric
  )

  returns setof record language sql as $$

  SELECT snapshots.*
  FROM "Snapshots" snapshots
    INNER JOIN runs      ON snapshots.run_id = runs.id
    INNER JOIN branches  ON runs.branch_id = branches.id
    INNER JOIN projects  ON branches.project_id = projects.id
  WHERE projects.id = project_id
    AND snapshots.primary_num_pixels > 0
    AND snapshots.primary_diff_path != ''
    AND snapshots.created_at >= after_created_at
  ORDER BY snapshots.path, snapshots.created_at DESC
  LIMIT max_limit;

  $$;
*/

import { ProjectId, Snapshot } from "../../../types";
import { assertQueryResponse, supabase } from "../supabase";

// TODO Delete this in favor of getRecentlyUpdatedSnapshotsForProject() once it's been confirmed to work.
export async function recentlyUpdatedSnapshotsForProject(
  projectId: ProjectId,
  afterDate: Date = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
  limit: number = 1000
): Promise<Snapshot[]> {
  return await assertQueryResponse<Snapshot>(
    () =>
      supabase.rpc("recently_updated_snapshots_for_project", {
        project_id: projectId,
        after_created_at: afterDate.toISOString(),
        max_limit: limit,
      }),
    `Could not find recently updated Snapshots for Project id "${projectId}" after date "${afterDate.toISOString()}"`
  );
}
