/*
  create or replace function find_branch_for_run(
    run_id uuid,
  )

  returns record language sql as $$

  SELECT branches.*
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
    LIMIT 1;

  $$;
*/

import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { Branch, RunId } from "../../../types";
import { assertQuerySingleResponse, supabase } from "../supabase";

export async function findBranchForRun(runId: RunId) {
  return assertQuerySingleResponse<Branch>(
    () =>
      supabase.rpc("find_branch_for_run", {
        run_id: runId,
      }) as PromiseLike<PostgrestSingleResponse<Branch>>,
    `Could not find Branch for Run "${runId}"`
  );
}
