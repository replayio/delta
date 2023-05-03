/*
  create or replace function primary_branch_for_project(
    github_run_id varchar
  )

  returns record language sql as $$

  SELECT *
  FROM branches
  WHERE project_id = project_id
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
  LIMIT 1

  $$;
*/

import { PostgrestResponse } from "@supabase/supabase-js";
import { ProjectId, Snapshot } from "../../../types";
import { ResponseError, supabase } from "../supabase";

export async function primaryBranchForProject(
  projectId: ProjectId
): Promise<ResponseError | PostgrestResponse<Snapshot>> {
  return supabase.rpc("primary_branch_for_project", {
    project_id: projectId,
  });
}
