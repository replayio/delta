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
  pr_url?: string;
  pr_title?: string;
  pr_number?: string;
  created_at: string;
  check_id: string;
  comment_id: string;
  status: string;
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
};

export type ResponseError = {
  error: string;
  data: null;
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
