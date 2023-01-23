import {
  PostgrestResponse,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";
import createClient from "../../initServerSupabase";

export const supabase = createClient();

export type Project = {
  created_at: string;
  id: string;
  name: string;
  organization: string;
  primary_branch: string;
  repository: string;
  short: string;
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
  // Has the snapshot changed from the prior action for this branch?
  action_changed: boolean;
  // GitHub action.
  action_id: string;
  created_at: string;
  // Key; used to associate snapshots between branches.
  file: string;
  // used to load snapshot image data (base64 string).
  path: string;
  // Has the snapshot changed from the primary/main branch?
  primary_changed: boolean;
  // used to load diff image data (base64 string).
  primary_diff_path?: string;
  // Number of pixels that have changed from the primary/main branch.
  // Used for debugging; not exposed in the web UI.
  primary_num_pixels: number | null;
  // e.g. "Uploaded", "Duplicate"
  status: string | null;
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
  projectId: string
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

export async function getPublicProjects(): Promise<PostgrestResponse<Project>> {
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
