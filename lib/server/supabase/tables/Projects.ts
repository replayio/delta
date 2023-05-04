import { Project, ProjectId, ProjectSlug, RunId } from "../../../types";
import { supabase } from "../../initSupabase";
import { assertQueryResponse, assertQuerySingleResponse } from "../supabase";

export async function getPublicProjects() {
  return assertQueryResponse<Project>(
    () => supabase.from("projects").select("*").eq("public", true),
    `Could not find public Project`
  );
}

export async function getProjectForId(projectId: ProjectId) {
  return assertQuerySingleResponse<Project>(
    () => supabase.from("projects").select("*").eq("id", projectId).single(),
    `Could not find Project "${projectId}"`
  );
}

export async function getProjectForOrganizationAndRepository(
  organization: string,
  repository: string
) {
  return assertQuerySingleResponse<Project>(
    () =>
      supabase
        .from("projects")
        .select("*")
        .eq("organization", organization)
        .eq("repository", repository)
        .single(),
    `Could not find Project for organization "${organization}" and repository "${repository}"`
  );
}

export async function getProjectForRun(runId: RunId) {
  return assertQuerySingleResponse<Project>(
    () =>
      supabase
        .from("projects")
        .select("*, branches(pull_requests(runs(id)))")
        .eq("branches.pull_requests.runs.id", runId)
        .single(),
    `Could not find Project for Run "${runId}"`
  );
}

export async function getProjectForSlug(projectSlug: ProjectSlug) {
  return assertQuerySingleResponse<Project>(
    () =>
      supabase.from("projects").select("*").eq("slug", projectSlug).single(),
    `Could not find Project with slug "${projectSlug}"`
  );
}
