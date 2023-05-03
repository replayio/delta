/*
  create or replace function increment_snapshots_count(
    run_id uuid
  )

  returns int2 language sql as $$

  UPDATE runs
  SET num_snapshots = num_snapshots + 1
  WHERE id = run_id
  RETURNING num_snapshots;

  $$;
*/

import { PostgrestResponse } from "@supabase/supabase-js";
import { RunId } from "../../../types";
import { retryOnError, supabase } from "../supabase";

export async function incrementSnapshotsCount(
  id: RunId
): Promise<PostgrestResponse<number>> {
  return retryOnError(() =>
    supabase.rpc("increment_snapshots_count", {
      run_id: id,
    })
  );
}
