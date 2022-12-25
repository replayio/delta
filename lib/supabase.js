import createClient from "./initServerSupabase";
const { createHash } = require("crypto");

const supabase = createClient();

export async function getProjectIdFromActionId(actionId) {
  const actionRecord = await supabase
    .from("Actions")
    .select("*")
    .eq("id", actionId);
  console.log(actionRecord);
  const projectId = actionRecord.data[0].project_id;
  return projectId;
}

export async function getSnapshotFromBranch(image, projectId, branchName) {
  const { branch } = await getBranchFromProject(projectId, branchName);

  if (!branch) {
    return { error: "Branch not found" };
  }

  const response = await supabase
    .from("Snapshots")
    .select("*, Actions(branch_id)")
    .eq("file", image.file)
    .eq("Actions.branch_id", branch.id)
    .limit(1);

  if (response.error) {
    console.log("getSnapshotFromBranch error", response.error);
    return { error: response.error };
  }

  return { snapshot: response.data?.[0] };
}

export async function getSnapshotsFromBranch(projectId, branchName) {
  const { branch } = await getBranchFromProject(projectId, branchName);

  if (!branch) {
    return { error: "Branch not found" };
  }

  const response = await supabase
    .from("Snapshots")
    .select("*, Actions(branch_id)")
    .eq("Actions.branch_id", branch.id);

  if (response.error) {
    console.log("getSnapshotFromBranch error", response.error);
    return { error: response.error };
  }

  return { snapshots: response.data };
}

export async function insertSnapshot(
  branchName,
  projectId,
  image,
  status,
  primary_changed,
  action_changed
) {
  const { branch } = await getBranchFromProject(projectId, branchName);
  const { action } = await getAction(branch.id);
  const sha = createHash("sha256").update(image.content).digest("hex");

  return supabase.from("Snapshots").insert({
    sha,
    action_id: action.id,
    path: `${projectId}/${sha}.png`,
    file: image.file,
    status,
    action_changed,
    primary_changed,
  });
}

export async function getProject(projectId) {
  const projectResponse = await supabase
    .from("Projects")
    .select("*")
    .eq("id", projectId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (projectResponse.error) {
    console.log("getProject error", projectResponse.error);
    return { error: projectResponse.error };
  }

  return { project: projectResponse.data[0] };
}

export async function getProjectFromRepo(repository, organization) {
  const projectResponse = await supabase
    .from("Projects")
    .select("*")
    .eq("organization", organization)
    .eq("repository", repository)
    .limit(1);

  if (projectResponse.error) {
    console.log("error", projectResponse.error);
    return { error: projectResponse.error };
  }

  return projectResponse.data[0];
}

export async function getBranchFromProject(projectId, branch) {
  const res = await supabase
    .from("Branches")
    .select("*")
    .eq("project_id", projectId)
    .eq("name", branch)
    .limit(1);

  if (res.error) {
    return { error: res.error };
  }

  return { branch: res.data[0] };
}

export async function getAction(branch_id) {
  const resp = await supabase
    .from("Actions")
    .select("*")
    .eq("branch_id", branch_id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (resp.error) {
    return { error: resp.error };
  }

  return { action: resp.data[0] };
}
