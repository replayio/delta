import {
  PostgrestResponse,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";
import createClient from "../../initServerSupabase";

export const supabase = createClient();

export type Project = {
  id: string;
  short: string;
  repository: string;
  organization: string;
  created_at: string;
  primary_branch: string;
};

export type Branch = {
  id: string;
  name: string;
  project_id: string;
  pr_title?: string;
  pr_number?: string;
  created_at: string;
  check_id: string;
  comment_id: string;
  status: string;
  head_sha: string;
};

export type Action = {
  id: string;
  branch_id: string;
  created_at: string;
  run_id: string;
  head_sha: string;
  actor: string;
  status?: "success" | "failure" | "neutral";
  num_snapshots: number;
  num_snapshots_changed: number;
};

export type Snapshot = {
  id: string;
  sha: string;
  action_id: string;
  path: string;
  file: string;
  status: string;
  action_changed: boolean;
  primary_changed: boolean;
  created_at: string;
  primary_diff_path?: string;
  primary_num_pixels?: number;
};

export type ResponseError = {
  error: string;
  data: null;
};

export type GithubEvent = {
  id: number;
  event_type: string;
  action: string;
  payload: Object;
  pr_number?: string;
  head_sha: string;
  branch_name?: string;
  job_id?: string;
  run_id?: string;
  check: Object;
  comment: Object;
};

export const createError = (error: string): ResponseError => ({
  error,
  data: null,
});

export async function getProject(
  projectId
): Promise<PostgrestSingleResponse<Project>> {
  return supabase
    .from("Projects")
    .select("*")
    .eq("id", projectId)
    .order("created_at", { ascending: false })
    .single();
}

export async function getProjectByShort(
  projectShort: string
): Promise<PostgrestSingleResponse<Project>> {
  return supabase
    .from("Projects")
    .select("*")
    .eq("short", projectShort)
    .single();
}

export async function getPublicProjects(): Promise<
  PostgrestResponse<Project[]>
> {
  return supabase
    .from("Projects")
    .select("*")
    .eq("public", true)
    .order("created_at", { ascending: false });
}

export async function getProjectFromRepo(
  repository: string,
  organization: string
): Promise<PostgrestSingleResponse<Project>> {
  return supabase
    .from("Projects")
    .select("*")
    .eq("organization", organization)
    .eq("repository", repository)
    .single();
}
export async function insertGithubEvent(
  event: Partial<GithubEvent>
): Promise<PostgrestSingleResponse<GithubEvent>> {
  return supabase.from("GithubEvent").insert(event).single();
}

export async function updateGithubEvent(
  id: number,
  event: Partial<GithubEvent>
): Promise<PostgrestSingleResponse<GithubEvent>> {
  return supabase.from("GithubEvent").update(event).eq("id", id).single();
}
