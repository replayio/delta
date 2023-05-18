/**

create or replace function recently_updated_snapshots_for_project(
  project_id int8,
  after_created_at date,
  max_limit numeric
)

returns setof record language sql as $$

SELECT delta_file, delta_path, count(*)
FROM snapshots
WHERE run_id IN (
  SELECT id
  FROM runs
  WHERE branch_id IN (
    SELECT id
    FROM branches
    WHERE project_id = project_id
    AND name = (
      SELECT primary_branch
      FROM projects
      WHERE id = project_id
    )
  )
)
AND created_at >= after_created_at
GROUP BY delta_file, delta_path
ORDER BY delta_file ASC, delta_path ASC
LIMIT max_limit

$$;

*/

import { PostgrestResponse } from "@supabase/supabase-js";
import { ProjectId } from "../../../types";
import { supabase } from "../../initSupabase";
import { retryOnError } from "../supabase";

export async function getMostRecentlyUpdatedSnapshotsForProject(
  projectId: ProjectId,
  afterDate: Date = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
  limit: number = 1000
): Promise<
  PostgrestResponse<{ count: number; delta_file: string; delta_path: string }>
> {
  return await retryOnError(() =>
    supabase.rpc("recently_updated_snapshots_for_project", {
      project_id: projectId,
      after_created_at: afterDate.toISOString(),
      max_limit: limit,
    })
  );
}
