import {
  PostgrestSingleResponse,
  PostgrestResponse,
} from "@supabase/supabase-js";
import { Branch, supabase } from "./supabase";

export async function getBranchFromProject(
  projectId: string,
  branchName: string
): Promise<PostgrestSingleResponse<Branch>> {
  return supabase
    .from("Branches")
    .select("*")
    .eq("project_id", projectId)
    .eq("name", `${branchName}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
}

export async function getBranchFromPr(
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

export async function getBranch(
  branchId: string
): Promise<PostgrestSingleResponse<Branch>> {
  return supabase.from("Branches").select("*").eq("id", branchId).single();
}

export async function getBranchByName(
  name: string
): Promise<PostgrestSingleResponse<Branch>> {
  return supabase.from("Branches").select("*").eq("name", name).single();
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
