import {
  PostgrestResponse,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";
import createClient from "./initServerSupabase";
const { createHash } = require("crypto");

const supabase = createClient();

export type Project = {
  id: string;
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
  status: string;
};

export type Action = {
  id: string;
  branch_id: string;
  created_at: string;
  run_id: string;
  head_sha: string;
  actor: string;
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
};

type ResponseError = {
  error: string;
  data: null;
};

const createError = (error: string): ResponseError => ({ error, data: null });

export async function getSnapshotFromBranch(
  image: { file: string; content: string },
  projectId: string,
  branchName: string
): Promise<ResponseError | PostgrestSingleResponse<Snapshot>> {
  const branch = await getBranchFromProject(projectId, branchName);

  if (branch.error) {
    return createError("Branch not found");
  }

  return supabase
    .from("Snapshots")
    .select("*, Actions(branch_id)")
    .eq("file", image.file)
    .eq("Actions.branch_id", branch.data.id)
    .single();
}

export async function getSnapshotsFromBranch(
  projectId: string,
  branchName: string
): Promise<ResponseError | PostgrestResponse<Snapshot>> {
  const branch = await getBranchFromProject(projectId, branchName);

  if (branch.error) {
    return createError("Branch not found");
  }

  const actions = await getActionsFromBranch(branch.data.id);

  if (actions.error) {
    return createError("Action not found");
  }

  for (const action of actions.data) {
    console.log(
      `getSnapshotsFromBranch(${projectId}, ${branchName})`,
      action.id
    );

    const snapshots = await supabase
      .from("Snapshots")
      .select("*")
      .eq("action_id", action.id);

    if (snapshots.error) {
      continue;
    }
    if (snapshots.data.length > 0) {
      return snapshots;
    }
  }
}

export async function insertSnapshot(
  branchName,
  projectId,
  image,
  status,
  primary_changed,
  action_changed = false
): Promise<ResponseError | PostgrestSingleResponse<Snapshot>> {
  const branch = await getBranchFromProject(projectId, branchName);
  if (branch.error) {
    return createError(`Branch not found for ${branchName}`);
  }
  const action = await getActionFromBranch(branch.data.id);
  if (action.error) {
    return createError(
      `Action not found for ${branchName} and ${
        branch.data.id
      }: ${JSON.stringify(action.error)}`
    );
  }

  const sha = createHash("sha256").update(image.content).digest("hex");

  return supabase
    .from("Snapshots")
    .insert({
      sha,
      action_id: action.data.id,
      path: `${projectId}/${sha}.png`,
      file: image.file,
      status,
      action_changed,
      primary_changed,
    })
    .single();
}

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
