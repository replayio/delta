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
    .eq("name", branch)
    .single();
}

export async function getBranchesFromProject(
  projectId: string
): Promise<PostgrestResponse<Branch>> {
  return supabase.from("Branches").select("*").eq("project_id", projectId);
}

export async function updateBranch(branch: Branch, data: Partial<Branch>) {
  return supabase.from("Branches").update(data).eq("id", branch.id).single();
}
