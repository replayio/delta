/*
  create or replace function find_project_for_run(
    run_id uuid,
  )

  returns record language sql as $$

  SELECT projects.*
    FROM projects
    WHERE id = (
      SELECT project_id
        FROM branches
        WHERE id = (
          SELECT branch_id
          FROM pull_requests
          WHERE id = (
            SELECT pull_request_id
            FROM runs
            WHERE id = run_id
            LIMIT 1
          )
          LIMIT 1
        )
        LIMIT 1
      )
      LIMIT 1;

  $$;
*/

import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { Project, RunId } from "../../../types";
import { assertQuerySingleResponse, supabase } from "../supabase";

export async function findProjectForRun(runId: RunId) {
  return assertQuerySingleResponse<Project>(
    () =>
      supabase.rpc("find_project_for_run", {
        run_id: runId,
      }) as PromiseLike<PostgrestSingleResponse<Project>>,
    `Could not find Project for Run "${runId}"`
  );
}
