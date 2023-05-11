import type { WorkflowRunInProgressEvent } from "@octokit/webhooks-types";
import { getDeltaBranchUrl } from "../../../lib/delta";
import { createCheck } from "../../../lib/server/github/Checks";
import { getBranchForProjectAndOrganizationAndBranchName } from "../../../lib/server/supabase/tables/Branches";
import { getProjectForOrganizationAndRepository } from "../../../lib/server/supabase/tables/Projects";
import { insertRun } from "../../../lib/server/supabase/tables/Runs";
import { GithubCheckId, GithubRunId } from "../../../lib/types";

export async function handleWorkflowRunInProgress(
  event: WorkflowRunInProgressEvent
): Promise<boolean> {
  if (!event.organization) {
    throw Error(`Missing required parameters event parameters`);
  }

  const projectOrganization = event.organization.login;
  const projectRepository = event.repository.name;
  const project = await getProjectForOrganizationAndRepository(
    projectOrganization,
    projectRepository
  );

  const organization = event.workflow_run.head_repository.owner.login;
  const branchName = event.workflow_run.head_branch;
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

  const check = await createCheck(projectOrganization, projectRepository, {
    details_url: getDeltaBranchUrl(project, branchName),
    head_sha: branchName,
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
