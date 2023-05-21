/**

CREATE FUNCTION recently_updated_snapshot_data_for_project(
    target_project_id int8,
    after_created_at timestamp
)
RETURNS TABLE (
    supabase_path varchar,
    delta_variant varchar,
    delta_test_filename varchar,
    delta_test_name varchar,
    delta_image_filename varchar
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        snapshot_variants.supabase_path,
        snapshot_variants.delta_variant,
        snapshots.delta_test_filename,
        snapshots.delta_test_name,
        snapshots.delta_image_filename
    FROM snapshot_variants
    INNER JOIN snapshots on snapshots.id = snapshot_variants.snapshot_id
    WHERE run_id IN (
        SELECT id
        FROM runs
        WHERE branch_id IN (
            select id
            FROM branches
            WHERE project_id = target_project_id
                AND name IN (
                    SELECT primary_branch
                    FROM projects
                    WHERE id = target_project_id
                )
            )
        )
    AND snapshots.created_at > after_created_at;
END;
$$ LANGUAGE plpgsql;

*/

import { PostgrestResponse } from "@supabase/supabase-js";
import { ProjectId } from "../../../types";
import { supabase } from "../../initSupabase";
import { retryOnError } from "../supabase";

export type RecentlyUpdatedSnapshotData = {
  delta_image_filename: string;
  delta_test_filename: string;
  delta_test_name: string;
  delta_variant: string;
  supabase_path: string;
};

export async function getRecentlyUpdatedSnapshotDataForProject(
  projectId: ProjectId,
  afterDate: Date = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
): Promise<PostgrestResponse<RecentlyUpdatedSnapshotData>> {
  return await retryOnError(() =>
    supabase.rpc("recently_updated_snapshot_data_for_project", {
      target_project_id: projectId,
      after_created_at: afterDate.toISOString(),
    })
  );
}
