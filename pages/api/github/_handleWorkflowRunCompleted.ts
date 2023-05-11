import type { WorkflowRunCompletedEvent } from "@octokit/webhooks-types";
import getSnapshotDiffCount from "../../../lib/server/getSnapshotDiffCount";
import { updateCheck } from "../../../lib/server/github/Checks";
import {
  getBranchForProjectAndOrganizationAndBranchName,
  getPrimaryBranchForProject,
} from "../../../lib/server/supabase/tables/Branches";
import { getProjectForOrganizationAndRepository } from "../../../lib/server/supabase/tables/Projects";
import {
  getMostRecentRunForBranch,
  getRunsForGithubRunId,
} from "../../../lib/server/supabase/tables/Runs";
import { getSnapshotsForRun } from "../../../lib/server/supabase/tables/Snapshots";
import { GithubRunId } from "../../../lib/types";

export async function handleWorkflowRunCompleted(
  event: WorkflowRunCompletedEvent
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

  const githubRunId = event.workflow_run.id as unknown as GithubRunId;
  const run = await getRunsForGithubRunId(githubRunId);

  const primaryBranch = await getPrimaryBranchForProject(project);
  if (branch.id !== primaryBranch.id) {
    const primaryBranchRun = await getMostRecentRunForBranch(primaryBranch.id);

    const oldSnapshots = primaryBranchRun
      ? await getSnapshotsForRun(primaryBranchRun.id)
      : [];
    const newSnapshots = await getSnapshotsForRun(run.id);

    const count = getSnapshotDiffCount(oldSnapshots, newSnapshots);

    await updateCheck(
      project.organization,
      project.repository,
      run.github_check_id,
      {
        conclusion: "neutral",
        output: {
          summary: count > 0 ? `${count} snapshots changed` : "No changes",
          title: count > 0 ? "Completed" : "Requires approval",
        },
        status: "completed",
      }
    );

    // TODO Create or update PR comment
  }

  return true;
}
