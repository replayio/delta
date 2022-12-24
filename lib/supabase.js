import createClient from "./initServerSupabase";

const supabase = createClient();

async function getProjectIdFromActionId(actionId) {
  const actionRecord = await supabase
    .from("Actions")
    .select("*")
    .eq("id", actionId);
  console.log(actionRecord);
  const projectId = actionRecord.data[0].project_id;
  return projectId;
}

async function getSnapshotFromBranch(image, projectId, branch) {
  const response = await supabase
    .from("Snapshots")
    .select("*, Actions(branch)")
    .eq("file", image.file)
    .eq("Actions.project_id", projectId)
    .eq("Actions.branch", branch)
    .limit(1);

  return response.data[0];
}

function insertSnapshot(
  sha,
  actionId,
  projectId,
  image,
  status,
  primary_changed,
  action_changed
) {
  return supabase.from("Snapshots").insert([
    {
      sha,
      action_id: actionId,
      path: `${projectId}/${sha}.png`,
      file: image.file,
      status,
      action_changed,
      primary_changed,
    },
  ]);
}

async function getProject(projectId) {
  const projectResponse = await supabase
    .from("Projects")
    .select("*")
    .eq("id", projectId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (projectResponse.error) {
    console.log("error", projectResponse.error);
    return { error: projectResponse.error };
  }

  return projectResponse.data[0];
}

async function getProjectFromRepo(repository, organization) {
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

async function getBranchFromProject(projectId, branch) {
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

async function getAction(projectId, branch) {
  const resp = supabase
    .from("Actions")
    .select("*")
    .eq("branch", branch)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (resp.error) {
    return { error: resp.error };
  }

  return { action: resp.data[0] };
}

module.exports = {
  getBranchFromProject,
  getSnapshotFromBranch,
  getProject,
  getProjectIdFromActionId,
  getProjectFromRepo,
  getAction,
  insertSnapshot,
};
