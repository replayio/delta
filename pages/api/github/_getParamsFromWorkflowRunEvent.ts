import { WorkflowRunEvent } from "@octokit/webhooks-types";
import { ExtractedEventParams } from "./types";

export function getParamsFromWorkflowRunEvent(
  event: WorkflowRunEvent
): ExtractedEventParams {
  return {
    branchName: event.workflow_run.head_branch,
    organization: event.workflow_run.head_repository.owner.login,
    projectOrganization: event.organization?.login ?? null,
    projectRepository: event.repository.name,
  };
}
