import type { PullRequestClosedEvent } from "@octokit/webhooks-types";
import {
  getBranchForProjectAndOrganizationAndBranchName,
  updateBranch,
} from "../../../lib/server/supabase/tables/Branches";
import { getProjectForOrganizationAndRepository } from "../../../lib/server/supabase/tables/Projects";

export async function handlePullRequestClosedEvent(
  event: PullRequestClosedEvent
): Promise<boolean> {
  if (!event.organization || !event.pull_request.head.repo) {
    throw Error(`Missing required parameters event parameters`);
  }

  const projectOrganization = event.organization.login;
  const projectRepository = event.repository.name;
  const project = await getProjectForOrganizationAndRepository(
    projectOrganization,
    projectRepository
  );

  const organization = event.pull_request.head.repo.owner.login;
  const branchName = event.pull_request.head.ref;
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

  await updateBranch(branch.id, {
    github_pr_status: "closed",
  });

  return true;
}
