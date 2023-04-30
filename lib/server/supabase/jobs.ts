import {
  PostgrestResponse,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";
import { BranchId, Job, JobId, ProjectId, RunId, Snapshot } from "../../types";
import { retryOnError, supabase } from "./supabase";

export async function getJob(
  jobId: JobId
): Promise<PostgrestSingleResponse<Job>> {
  return retryOnError(() =>
    supabase.from("Jobs").select("*").eq("id", jobId).single()
  );
}

export async function getJobForRun(
  runId: RunId
): Promise<PostgrestSingleResponse<Job>> {
  return retryOnError(() =>
    supabase.from("Jobs").select("*").eq("run_id", runId).single()
  );
}

export async function getJobForBranch(
  branchId: BranchId,
  runId?: string
): Promise<PostgrestSingleResponse<Job>> {
  let query = supabase.from("Jobs").select("*").eq("branch_id", branchId);
  if (runId) {
    query = query.eq("run_id", runId);
  }

  return retryOnError(() =>
    query.order("created_at", { ascending: false }).limit(1).single()
  );
}

export async function getSnapshotsForJob(
  jobId: JobId
): Promise<PostgrestResponse<Snapshot>> {
  const result = await retryOnError(() =>
    supabase
      .from("Jobs")
      .select("Actions(Snapshots(*))")
      .eq("id", jobId)
      .order("created_at", { ascending: false })
      .limit(1000)
  );

  if (result.error) {
    return result;
  } else {
    return {
      ...result,
      data: result.data?.[0].Actions[0].Snapshots,
    };
  }
}

export async function incrementNumSnapshots(jobId: JobId) {
  return retryOnError(() =>
    supabase.rpc("increment_snapshots_count", {
      job_id: jobId,
    })
  );
}

export async function incrementNumSnapshotsChanged(jobId: JobId) {
  return retryOnError(() =>
    supabase.rpc("increment_snapshots_changed_count", {
      job_id: jobId,
    })
  );
}

export async function updateJob(
  jobId: JobId,
  job: Partial<Job>
): Promise<PostgrestSingleResponse<Job>> {
  return retryOnError(() =>
    supabase.from("Jobs").update(job).eq("id", jobId).single()
  );
}
