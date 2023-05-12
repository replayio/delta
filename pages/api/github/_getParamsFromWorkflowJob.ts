import { WorkflowJobEvent } from "@octokit/webhooks-types";
import { ExtractedEventParams } from "./types";

export function getParamsFromWorkflowJobEvent(
  event: WorkflowJobEvent
): ExtractedEventParams {
  const projectOrganization = event.organization?.login ?? null;
  const projectRepository = event.repository.name;

  return {
    branchName: event.workflow_job.head_branch,
    organization: null,
    projectOrganization,
    projectRepository,
  };
}
