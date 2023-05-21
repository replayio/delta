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
  getMostRecentSuccessfulRunForBranch,
  getRunForGithubRunId,
  updateRun,
} from "../../../lib/server/supabase/tables/Runs";
import { getSnapshotVariantsForRun } from "../../../lib/server/supabase/tables/SnapshotVariants";
import { GithubCommentId, GithubRunId } from "../../../lib/types";
import { getParamsFromWorkflowRunEvent } from "./_getParamsFromWorkflowRunEvent";

export async function handleWorkflowRunCompletedEvent(
  event: WorkflowRunCompletedEvent
): Promise<boolean> {
  const { branchName, organization, projectOrganization, projectRepository } =
    getParamsFromWorkflowRunEvent(event);

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

  const githubRunId = event.workflow_run.id as unknown as GithubRunId;
  const run = await getRunForGithubRunId(githubRunId);

  const conclusion = event.workflow_run.conclusion;

  await updateRun(run.id, {
    github_conclusion: conclusion,
    github_status: "completed",
  });

  if (conclusion !== "success") {
    await updateCheck(
      project.organization,
      project.repository,
      run.github_check_id,
      {
        conclusion: "neutral",
        output: {
          summary: `Workflow concluded with status "${conclusion}"`,
          title: "Workflow inconclusive",
        },
        status: "completed",
      }
    );
  } else {
    const primaryBranch = await getPrimaryBranchForProject(project);
    if (branch.id !== primaryBranch.id) {
      const primaryBranchRun = await getMostRecentSuccessfulRunForBranch(
        primaryBranch.id
      );

      const oldSnapshotVariants = primaryBranchRun
        ? await getSnapshotVariantsForRun(primaryBranchRun.id)
        : [];
      const newSnapshotVariants = await getSnapshotVariantsForRun(run.id);

      const count = await getSnapshotDiffCount(
        oldSnapshotVariants,
        newSnapshotVariants
      );

      await updateCheck(
        project.organization,
        project.repository,
        run.github_check_id,
        {
          conclusion: count > 0 ? "failure" : "success",
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
  }

  return true;
}
