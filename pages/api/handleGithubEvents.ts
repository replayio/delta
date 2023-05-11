import type { NextApiRequest, NextApiResponse } from "next";

import type {
  PullRequestClosedEvent,
  PullRequestEvent,
  PullRequestOpenedEvent,
  PullRequestReopenedEvent,
  WorkflowJobEvent,
  WorkflowRunCompletedEvent,
  WorkflowRunEvent,
  WorkflowRunInProgressEvent,
} from "@octokit/webhooks-types";
import { getDeltaBranchUrl } from "../../lib/delta";
import getSnapshotDiffCount from "../../lib/server/getSnapshotDiffCount";
import { createCheck, updateCheck } from "../../lib/server/github/Checks";
import { getHTTPRequests, setupHook } from "../../lib/server/http-replay";
import { insertHTTPEvent } from "../../lib/server/supabase/storage/HttpEvents";
import {
  getBranchForProjectAndOrganizationAndBranchName,
  getPrimaryBranchForProject,
  insertBranch,
  updateBranch,
} from "../../lib/server/supabase/tables/Branches";
import { insertGithubEvent } from "../../lib/server/supabase/tables/GithubEvents";
import { getProjectForOrganizationAndRepository } from "../../lib/server/supabase/tables/Projects";
import {
  getMostRecentRunForBranch,
  getRunsForGithubRunId,
  insertRun,
} from "../../lib/server/supabase/tables/Runs";
import { getSnapshotsForRun } from "../../lib/server/supabase/tables/Snapshots";
import {
  Branch,
  GithubCheckId,
  GithubEventType,
  GithubRunId,
} from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./constants";
import { ApiErrorResponse, ApiSuccessResponse } from "./types";
import { isApiErrorResponse, sendApiResponse } from "./utils";

// Spy on HTTP client requests for debug logging in Supabase.
setupHook();

export default async function handler(
  nextApiRequest: NextApiRequest,
  nextApiResponse: NextApiResponse<Response>
) {
  const eventType = nextApiRequest.headers["x-github-event"] as GithubEventType;

  let didRespond = false;
  let eventProcessed = false;

  async function logAndSendResponse(
    projectOrganization: string | undefined,
    projectRepository: string,
    action: string,
    apiResponse: ApiErrorResponse | ApiSuccessResponse
  ) {
    sendApiResponse(nextApiRequest, nextApiResponse, apiResponse);

    if (!projectOrganization) {
      return;
    }

    const project = await getProjectForOrganizationAndRepository(
      projectOrganization,
      projectRepository
    );

    const githubEvent = await insertGithubEvent({
      action,
      handled: eventProcessed,
      payload: nextApiRequest.body,
      project_id: project.id,
      type: eventType,
    });

    insertHTTPEvent({
      data: {
        request: {
          body: nextApiRequest.body,
          method: nextApiRequest.method,
          query: nextApiRequest.query,
          rawHeaders: nextApiRequest.rawHeaders,
          url: nextApiRequest.url,
        },
        // Recorded using Node's "async_hooks"; see setupHook()
        requests: getHTTPRequests(),
        response: isApiErrorResponse(apiResponse)
          ? {
              data: apiResponse,
              deltaErrorCode: apiResponse.deltaErrorCode.code,
              httpStatusCode: apiResponse.httpStatusCode.code,
            }
          : {
              data: apiResponse,
              httpStatusCode: apiResponse.httpStatusCode.code,
            },
      },
      githubEventId: githubEvent.id,
      githubEventType: eventType,
      projectId: project.id,
    });
  }

  try {
    switch (eventType) {
      case "pull_request": {
        // https://docs.github.com/webhooks-and-events/webhooks/webhook-events-and-payloads#pull_request
        const event = nextApiRequest.body as PullRequestEvent;
        switch (event.action) {
          case "closed":
            eventProcessed = true;
            didRespond = await handlePullRequestClosedEvent(event);
            break;
          case "opened":
          case "reopened":
            eventProcessed = true;
            didRespond = await handlePullRequestOpenedOrReopenedEvent(event);
            break;
          default:
            // Don't care about the other action types
            break;
        }
        break;
      }
      case "workflow_job": {
        // https://docs.github.com/webhooks-and-events/webhooks/webhook-events-and-payloads#workflow_run
        const event = nextApiRequest.body as WorkflowJobEvent;
        if (event.workflow_job.workflow_name === "Delta") {
          const projectOrganization = event.organization?.login;
          const projectRepository = event.repository?.name;

          let project;
          if (projectOrganization && projectRepository) {
            project = await getProjectForOrganizationAndRepository(
              projectOrganization,
              projectRepository
            );
          }

          await insertGithubEvent({
            action: nextApiRequest.body.action,
            handled: false,
            payload: nextApiRequest.body,
            project_id: project?.id ?? null,
            type: eventType,
          });
        }
      }
      case "workflow_run": {
        // https://docs.github.com/webhooks-and-events/webhooks/webhook-events-and-payloads#workflow_run
        const event = nextApiRequest.body as WorkflowRunEvent;
        if (event.workflow.name === "Delta") {
          switch (event.action) {
            case "completed":
              eventProcessed = true;
              didRespond = await handleWorkflowRunCompleted(event);
              break;
            case "in_progress":
              eventProcessed = true;
              didRespond = await handleWorkflowRunInProgress(event);
              break;
          }
        }
        break;
      }
      default: {
        // Don't care about other event types
        break;
      }
    }
  } catch (error) {
    console.error(error);

    return sendApiResponse(nextApiRequest, nextApiResponse, {
      data: {
        message: "Internal server error",
      },
      deltaErrorCode: DELTA_ERROR_CODE.API.REQUEST_FAILED,
      httpStatusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
    });
  }

  if (!didRespond) {
    // No-op response
    return sendApiResponse(nextApiRequest, nextApiResponse, {
      data: null,
      httpStatusCode: HTTP_STATUS_CODES.NO_CONTENT,
    });
  }

  async function handlePullRequestClosedEvent(
    event: PullRequestClosedEvent
  ): Promise<boolean> {
    if (!event.organization || !event.pull_request.head.repo) {
      sendApiResponse(nextApiRequest, nextApiResponse, {
        data: Error(`Missing required parameters event parameters`),
        deltaErrorCode: DELTA_ERROR_CODE.MISSING_PARAMETERS,
        httpStatusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      });

      return true;
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

    logAndSendResponse(projectOrganization, projectRepository, event.action, {
      data: null,
      httpStatusCode: HTTP_STATUS_CODES.NO_CONTENT,
    });

    return true;
  }

  async function handlePullRequestOpenedOrReopenedEvent(
    event: PullRequestOpenedEvent | PullRequestReopenedEvent
  ): Promise<boolean> {
    if (!event.organization || !event.pull_request.head.repo) {
      sendApiResponse(nextApiRequest, nextApiResponse, {
        data: Error(`Missing required parameters event parameters`),
        deltaErrorCode: DELTA_ERROR_CODE.MISSING_PARAMETERS,
        httpStatusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      });

      return true;
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

    logAndSendResponse(projectOrganization, projectRepository, event.action, {
      data: null,
      httpStatusCode: HTTP_STATUS_CODES.NO_CONTENT,
    });

    return true;
  }

  async function handleWorkflowRunCompleted(
    event: WorkflowRunCompletedEvent
  ): Promise<boolean> {
    if (!event.organization) {
      sendApiResponse(nextApiRequest, nextApiResponse, {
        data: Error(`Missing required parameters event parameters`),
        deltaErrorCode: DELTA_ERROR_CODE.MISSING_PARAMETERS,
        httpStatusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      });

      return true;
    }

    const projectOrganization = event.organization.login;
    const projectRepository = event.repository.name;
    const project = await getProjectForOrganizationAndRepository(
      projectOrganization,
      projectRepository
    );

    const organization = event.workflow_run.head_repository.name;
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
      const primaryBranchRun = await getMostRecentRunForBranch(
        primaryBranch.id
      );

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

  async function handleWorkflowRunInProgress(
    event: WorkflowRunInProgressEvent
  ): Promise<boolean> {
    if (!event.organization) {
      sendApiResponse(nextApiRequest, nextApiResponse, {
        data: Error(`Missing required parameters event parameters`),
        deltaErrorCode: DELTA_ERROR_CODE.MISSING_PARAMETERS,
        httpStatusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      });

      return true;
    }

    const projectOrganization = event.organization.login;
    const projectRepository = event.repository.name;
    const project = await getProjectForOrganizationAndRepository(
      projectOrganization,
      projectRepository
    );

    const organization = event.workflow_run.head_repository.name;
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

    const check = await createCheck(projectOrganization, projectRepository, {
      details_url: getDeltaBranchUrl(project, branchName),
      head_sha: branchName,
      output: {
        summary: "In progress...",
        title: "Tests are running",
      },
      status: "in_progress",
    });

    const actor = event.sender.login;
    const githubRunId = event.workflow_run.id as unknown as GithubRunId;

    await insertRun({
      branch_id: branch.id,
      delta_has_user_approval: false,
      github_actor: actor,
      github_check_id: check.id as unknown as GithubCheckId,
      github_run_id: githubRunId,
      github_status: "pending",
    });

    return true;
  }
}
