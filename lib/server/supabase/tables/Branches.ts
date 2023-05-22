import { Branch, BranchId, Project, ProjectId } from "../../../types";
import { supabase } from "../../initSupabase";
import { assertQueryResponse, assertQuerySingleResponse } from "../supabase";

export async function getBranchForId(branchId: BranchId) {
  return assertQuerySingleResponse<Branch>(
    () => supabase.from("branches").select("*").eq("id", branchId).single(),
    `Could not find Branch "${branchId}"`
  );
}

export async function getBranchForProjectAndOrganizationAndBranchName(
  projectId: ProjectId,
  organization: string,
  name: string
) {
  return assertQuerySingleResponse<Branch>(
    () =>
      supabase
        .from("branches")
        .select("*")
        .eq("project_id", projectId)
        .eq("organization", organization)
        .eq("name", name)
        .single(),
    `Could not find Branch for Project "${projectId}" and organization "${organization}" with name "${name}"`
  );
}

export async function getBranchesForProject(
  projectId: ProjectId,
  open?: boolean,
  limit?: number
) {
  return assertQueryResponse<Branch>(() => {
    let query = supabase
      .from("branches")
      .select("*")
      .eq("project_id", projectId);
    if (open != null) {
      if (open) {
        query = query.eq("github_pr_status", "open");
      } else {
        query = query.not("github_pr_status", "eq", "open");
      }
    }
    if (limit != null) {
      query = query.limit(limit);
    }
    query = query.order("created_at", { ascending: false });
    return query;
  }, `Could not find ${open ? "open" : "closed or merged"} Branches for Project "${projectId}"`);
}

export async function getPrimaryBranchForProject(project: Project) {
  return assertQuerySingleResponse<Branch>(
    () =>
      supabase
        .from("branches")
        .select("*")
        .eq("project_id", project.id)
        .eq("organization", project.organization)
        .eq("name", project.primary_branch)
        .single(),
    `Could not find primary Branch for Project "${project.id}"`
  );
}

export async function insertBranch(
  newBranch: Omit<Branch, "created_at" | "id">
) {
  return assertQuerySingleResponse<Branch>(
    () => supabase.from("branches").insert(newBranch).single(),
    `Could not insert Branch`
  );
}

export async function updateBranch(branchId: BranchId, data: Partial<Branch>) {
  return assertQuerySingleResponse<Branch>(
    () => supabase.from("branches").update(data).eq("id", branchId).single(),
    `Could not update Branch "${branchId}"`
  );
}
