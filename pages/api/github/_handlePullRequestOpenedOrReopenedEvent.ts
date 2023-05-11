import type {
  PullRequestOpenedEvent,
  PullRequestReopenedEvent,
} from "@octokit/webhooks-types";
import {
  getBranchForProjectAndOrganizationAndBranchName,
  insertBranch,
  updateBranch,
} from "../../../lib/server/supabase/tables/Branches";
import { getProjectForOrganizationAndRepository } from "../../../lib/server/supabase/tables/Projects";
import { Branch } from "../../../lib/types";

export async function handlePullRequestOpenedOrReopenedEvent(
  event: PullRequestOpenedEvent | PullRequestReopenedEvent
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

  const prNumber = event.number;
  const organization = event.pull_request.head.repo.owner.login;
  const branchName = event.pull_request.head.ref;

  let branch: Branch;
  try {
    branch = await getBranchForProjectAndOrganizationAndBranchName(
      project.id,
      organization,
      branchName
    );
    if (
      branch.github_pr_status === "closed" ||
      branch.github_pr_number !== prNumber
    ) {
      updateBranch(branch.id, {
        github_pr_number: prNumber,
        github_pr_status: "open",
      });
    }
  } catch (error) {
    branch = await insertBranch({
      name: branchName,
      organization,
      project_id: project.id,
      github_pr_comment_id: null,
      github_pr_number: prNumber,
      github_pr_status: "open",
    });
  }

  return true;
}