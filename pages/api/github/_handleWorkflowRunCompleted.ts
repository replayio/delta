import type { WorkflowRunCompletedEvent } from "@octokit/webhooks-types";
import { getDeltaBranchUrl } from "../../../lib/delta";
import getSnapshotDiffCount from "../../../lib/server/getSnapshotDiffCount";
import { updateCheck } from "../../../lib/server/github/Checks";
import {
  createComment,
  updateComment,
} from "../../../lib/server/github/Comments";
import {
  getBranchForProjectAndOrganizationAndBranchName,
  getPrimaryBranchForProject,
  updateBranch,
} from "../../../lib/server/supabase/tables/Branches";
import { getProjectForOrganizationAndRepository } from "../../../lib/server/supabase/tables/Projects";
import {
  getMostRecentRunForBranch,
  getRunsForGithubRunId,
  updateRun,
} from "../../../lib/server/supabase/tables/Runs";
import { getSnapshotsForRun } from "../../../lib/server/supabase/tables/Snapshots";
import { GithubCommentId, GithubRunId } from "../../../lib/types";

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

  await updateRun(run.id, {
    github_status: "completed",
  });

  const primaryBranch = await getPrimaryBranchForProject(project);
  if (branch.id !== primaryBranch.id) {
    const primaryBranchRun = await getMostRecentRunForBranch(primaryBranch.id);

    const oldSnapshots = primaryBranchRun
      ? await getSnapshotsForRun(primaryBranchRun.id)
      : [];
    const newSnapshots = await getSnapshotsForRun(run.id);

    const count = await getSnapshotDiffCount(oldSnapshots, newSnapshots);

    await updateCheck(
      project.organization,
      project.repository,
      run.github_check_id,
      {
        conclusion: count > 0 ? "success" : "failure",
        output: {
          summary: count > 0 ? `${count} snapshots changed` : "No changes",
          title: count > 0 ? "Completed" : "Requires approval",
        },
        status: "completed",
      }
    );

    const deltaUrl = getDeltaBranchUrl(project, branch.id);
    const commentBody = `**<a href="${deltaUrl}">${count} snapshot changes from primary branch</a>**`;

    if (branch.github_pr_comment_id) {
      await updateComment(
        projectOrganization,
        projectRepository,
        branch.github_pr_comment_id,
        {
          body: commentBody,
        }
      );
    } else if (branch.github_pr_number) {
      const comment = await createComment(
        projectOrganization,
        projectRepository,
        branch.github_pr_number,
        { body: commentBody }
      );

      await updateBranch(branch.id, {
        github_pr_comment_id: comment.id as unknown as GithubCommentId,
      });
    }
  }

  return true;
}
