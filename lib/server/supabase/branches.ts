import {
  PostgrestResponse,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";
import { Branch, BranchId, ProjectId } from "../../types";
import { retryOnError, supabase } from "./supabase";

export async function getBranchForProject(
  projectId: ProjectId,
  branchName: string
): Promise<PostgrestSingleResponse<Branch>> {
  // There may be other branches with the same name as the primary branch;
  // e.g. PRs opened from forks
  // We want the primary branch for the main repository (organization)
  return retryOnError(() =>
    supabase
      .from("Branches")
      .select("*")
      .eq("project_id", projectId)
      .eq("name", `${branchName}`)
      .eq("status", "open")
      .limit(1)
      .single()
  );
}

export async function getBranchForPullRequest(
  projectId: ProjectId,
  prNumber: number
): Promise<PostgrestSingleResponse<Branch>> {
  return retryOnError(() =>
    supabase
      .from("Branches")
      .select("*")
      .eq("project_id", projectId)
      .eq("pr_number", prNumber)
      .single()
  );
}

export async function getBranch(
  branchId: BranchId
): Promise<PostgrestSingleResponse<Branch>> {
  return retryOnError(() =>
    supabase.from("Branches").select("*").eq("id", branchId).single()
  );
}

export async function getBranchByName(
  name: string
): Promise<PostgrestSingleResponse<Branch>> {
  return retryOnError(() =>
    supabase
      .from("Branches")
      .select("*")
      .eq("name", name)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
  );
}

export async function getBranchesForProject(
  projectId: ProjectId
): Promise<PostgrestResponse<Branch>> {
  return retryOnError(() =>
    supabase.from("Branches").select("*").eq("project_id", projectId)
  );
}

export async function updateBranch(branchId: BranchId, data: Partial<Branch>) {
  return retryOnError(() =>
    supabase.from("Branches").update(data).eq("id", branchId).single()
  );
}

export async function insertBranch(
  newBranch: Pick<
    Branch,
    "name" | "organization" | "pr_number" | "project_id" | "status"
  >
): Promise<PostgrestSingleResponse<Branch>> {
  return retryOnError(() =>
    supabase.from("Branches").insert(newBranch).single()
  );
}
