import type { PullRequestClosedEvent } from "@octokit/webhooks-types";
import {
  getBranchForProjectAndOrganizationAndBranchName,
  updateBranch,
} from "../../../lib/server/supabase/tables/Branches";
import { getProjectForOrganizationAndRepository } from "../../../lib/server/supabase/tables/Projects";

export async function handlePullRequestClosedEvent(
  event: PullRequestClosedEvent
): Promise<boolean> {
  const { branchName, organization, projectOrganization, projectRepository } =
    getParamsFromPullRequestClosedEvent(event);

  if (!projectOrganization || !organization) {
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

  await updateBranch(branch.id, {
    github_pr_status: "closed",
  });

  return true;
}

export function getParamsFromPullRequestClosedEvent(
  event: PullRequestClosedEvent
): {
  branchName: string;
  organization: string | null;
  projectOrganization: string | null;
  projectRepository: string;
} {
  return {
    branchName: event.pull_request.head.ref,
    organization: event.pull_request.head.repo?.owner.login ?? null,
    projectOrganization: event.organization?.login ?? null,
    projectRepository: event.repository.name,
  };
}
