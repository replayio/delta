import { Branch, BranchId, Project, ProjectId } from "../../../types";
import { supabase } from "../../initSupabase";
import {
  assertQueryResponse,
  assertQuerySingleResponse,
  assertQuerySingleResponseOrNull,
} from "../supabase";

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
  return assertQuerySingleResponseOrNull<Branch>(
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
  status?: string
) {
  return assertQueryResponse<Branch>(() => {
    let query = supabase
      .from("branches, pull_requests()")
      .select("*")
      .eq("project_id", projectId);
    if (status) {
      query = query.eq("pull_requests.github_status", status);
    }
    return query;
  }, `Could not find Branches for Project "${projectId}"${status ? ` and status "${status}"` : ""}`);
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
