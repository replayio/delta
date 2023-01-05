import {
  PostgrestSingleResponse,
  PostgrestResponse,
} from "@supabase/supabase-js";
import { Branch, supabase } from "./supabase";

export async function getBranchFromProject(
  projectId: string,
  branch: string
): Promise<PostgrestSingleResponse<Branch>> {
  return supabase
    .from("Branches")
    .select("*")
    .eq("project_id", projectId)
    .like("name", `%${branch}`)
    .limit(1)
    .single();
}

export async function getBranch(
  projectId: string,
  pr_number: number
): Promise<PostgrestSingleResponse<Branch>> {
  return supabase
    .from("Branches")
    .select("*")
    .eq("project_id", projectId)
    .eq("pr_number", pr_number)
    .single();
}

export async function getBranchesFromProject(
  projectId: string
): Promise<PostgrestResponse<Branch>> {
  return supabase.from("Branches").select("*").eq("project_id", projectId);
}

export async function updateBranch(branchId: string, data: Partial<Branch>) {
  return supabase.from("Branches").update(data).eq("id", branchId).single();
}

export async function insertBranch(
  newBranch: Partial<Branch>
): Promise<PostgrestSingleResponse<Branch>> {
  return supabase.from("Branches").insert(newBranch).single();
}
