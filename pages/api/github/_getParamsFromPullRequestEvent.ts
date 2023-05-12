import { PullRequestEvent } from "@octokit/webhooks-types";
import { ExtractedEventParams } from "./types";

export function getParamsFromPullRequestEvent(
  event: PullRequestEvent
): ExtractedEventParams {
  return {
    branchName: event.pull_request.head.ref,
    organization: event.pull_request.head.repo?.owner.login ?? null,
    projectOrganization: event.organization?.login ?? null,
    projectRepository: event.repository.name,
  };
}
