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

export async function updateBranch(branch: Branch, data: Partial<Branch>) {
  return supabase.from("Branches").update(data).eq("id", branch.id).single();
}

export async function getActionFromBranch(
  branch_id: string
): Promise<PostgrestSingleResponse<Action>> {
  return supabase
    .from("Actions")
    .select("*")
    .eq("branch_id", branch_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
}

export async function getActionFromRunId(
  run_id: string
): Promise<PostgrestSingleResponse<Action>> {
  return supabase
    .from("Actions")
    .select("*")
    .eq("run_id", run_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
}

export async function getActionsFromBranch(
  branch_id: string
): Promise<PostgrestResponse<Action>> {
  return supabase
    .from("Actions")
    .select("*")
    .eq("branch_id", branch_id)
    .order("created_at", { ascending: false });
}

export async function getAction(
  actionId: string
): Promise<PostgrestSingleResponse<Action>> {
  return supabase.from("Actions").select("*").eq("id", actionId).single();
}

export async function updateActionStatus(
  actionId: string,
  status: string
): Promise<PostgrestSingleResponse<Action>> {
  return supabase
    .from("Actions")
    .update({ status })
    .eq("id", actionId)
    .single();
}

export async function incrementActionNumSnapshots(action_id) {
  return supabase.rpc("snapshots_inc", {
    action_id,
  });
}

export async function incrementActionNumSnapshotsChanged(action_id) {
  return supabase.rpc("snapshots_changed_inc", {
    action_id,
  });
}
