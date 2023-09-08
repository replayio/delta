import type { WorkflowRunInProgressEvent } from "@octokit/webhooks-types";
import { getDeltaBranchUrl } from "../../../lib/delta";
import { createCheck } from "../../../lib/server/github/Checks";
import { POSTGRESQL_ERROR_CODES } from "../../../lib/server/supabase/constants";
import { getBranchForProjectAndOrganizationAndBranchName } from "../../../lib/server/supabase/tables/Branches";
import { getProjectForOrganizationAndRepository } from "../../../lib/server/supabase/tables/Projects";
import { insertRun } from "../../../lib/server/supabase/tables/Runs";
import { GithubCheckId, GithubRunId } from "../../../lib/types";
import { getParamsFromWorkflowRunEvent } from "./_getParamsFromWorkflowRunEvent";

export async function handleWorkflowRunInProgressEvent(
  event: WorkflowRunInProgressEvent
): Promise<boolean> {
  console.log(`Received workflow_run in_progress event ${event}`);

  const { branchName, organization, projectOrganization, projectRepository } =
    getParamsFromWorkflowRunEvent(event);

  if (!branchName || !organization || !projectOrganization) {
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

  const checkId = check.id as unknown as GithubCheckId;

  const actor = event.sender.login;
  const githubRunId = event.workflow_run.id as unknown as GithubRunId;

  try {
    await insertRun({
      branch_id: branch.id,
      delta_has_user_approval: false,
      github_actor: actor,
      github_check_id: checkId,
      github_conclusion: null,
      github_run_id: githubRunId,
      github_status: "pending",
    });
  } catch (error) {
    if (error.code !== POSTGRESQL_ERROR_CODES.UNIQUENESS_VIOLATION) {
      throw error;
    }
  }

  return true;
}
