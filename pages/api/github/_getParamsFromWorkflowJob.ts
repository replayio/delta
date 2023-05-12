import { WorkflowJobEvent } from "@octokit/webhooks-types";
import { ExtractedEventParams } from "./types";
import { getWorkflowRun } from "../../../lib/server/github/WorkflowRun";

export async function getParamsFromWorkflowJobEvent(
  event: WorkflowJobEvent
): Promise<ExtractedEventParams> {
  const projectOrganization = event.organization?.login ?? null;
  const projectRepository = event.repository.name;

  const workflowRunId = event.workflow_job.run_id;
  const workflowRun = projectOrganization
    ? await getWorkflowRun(
        projectOrganization,
        projectRepository,
        workflowRunId
      )
    : null;

  return {
    branchName: event.workflow_job.head_branch,
    organization: workflowRun?.head_repository?.owner?.login ?? null,
    projectOrganization,
    projectRepository,
  };
}
