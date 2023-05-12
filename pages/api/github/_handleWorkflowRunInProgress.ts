import type { WorkflowRunInProgressEvent } from "@octokit/webhooks-types";
import { getDeltaBranchUrl } from "../../../lib/delta";
import { createCheck } from "../../../lib/server/github/Checks";
import { getBranchForProjectAndOrganizationAndBranchName } from "../../../lib/server/supabase/tables/Branches";
import { getProjectForOrganizationAndRepository } from "../../../lib/server/supabase/tables/Projects";
import { insertRun } from "../../../lib/server/supabase/tables/Runs";
import { GithubCheckId, GithubRunId } from "../../../lib/types";
import { ExtractedEventParams } from "./types";

export async function handleWorkflowRunInProgress(
  event: WorkflowRunInProgressEvent
): Promise<boolean> {
  const { branchName, organization, projectOrganization, projectRepository } =
    getParamsFromWorkflowRunInProgress(event);

  if (!organization || !projectOrganization) {
    throw Error(`Missing required parameters event parameters`);
  }

  const project = await getProjectForOrganizationAndRepository(
    projectOrganization,
    projectRepository
  );

  const branch = await getBranchForProjectAndOrganizationAndBranchName(
    project.id,
    organization,
    branchName
  );
  if (branch == null) {
    throw Error(
      `No branches found for project ${project.id} and organization "${organization}" with name "${branchName}"`
    );
  }

  const sha = event.workflow_run.head_commit.id;
  const check = await createCheck(projectOrganization, projectRepository, {
    details_url: getDeltaBranchUrl(project, branch.id),
    head_sha: sha,
    output: {
      summary: "In progress...",
      title: "Tests are running",
    },
    status: "in_progress",
  });

  const actor = event.sender.login;
  const githubRunId = event.workflow_run.id as unknown as GithubRunId;

  await insertRun({
    branch_id: branch.id,
    delta_has_user_approval: false,
    github_actor: actor,
    github_check_id: check.id as unknown as GithubCheckId,
    github_run_id: githubRunId,
    github_status: "pending",
  });

  return true;
}

export function getParamsFromWorkflowRunInProgress(
  event: WorkflowRunInProgressEvent
): ExtractedEventParams {
  return {
    branchName: event.workflow_run.head_branch,
    organization: event.workflow_run.head_repository.owner.login,
    projectOrganization: event.organization?.login ?? null,
    projectRepository: event.repository.name,
  };
}
