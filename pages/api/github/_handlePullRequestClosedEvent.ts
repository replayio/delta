import type { PullRequestClosedEvent } from "@octokit/webhooks-types";
import {
  getBranchForProjectAndOrganizationAndBranchName,
  updateBranch,
} from "../../../lib/server/supabase/tables/Branches";
import { getProjectForOrganizationAndRepository } from "../../../lib/server/supabase/tables/Projects";
import { getParamsFromPullRequestEvent } from "./_getParamsFromPullRequestEvent";

export async function handlePullRequestClosedEvent(
  event: PullRequestClosedEvent
): Promise<boolean> {
  const { branchName, organization, projectOrganization, projectRepository } =
    getParamsFromPullRequestEvent(event);

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

  const status = event.pull_request.merged_at !== null ? "merged" : "closed";

  await updateBranch(branch.id, {
    github_pr_status: status,
  });

  return true;
}
