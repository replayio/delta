import type { NextApiRequest, NextApiResponse } from "next";

import type {
  PullRequestClosedEvent,
  PullRequestEvent,
  PullRequestOpenedEvent,
  PullRequestReopenedEvent,
  WorkflowJobCompletedEvent,
  WorkflowJobEvent,
  WorkflowJobQueuedEvent,
} from "@octokit/webhooks-types";
import { getDeltaBranchUrl } from "../../lib/delta";
import { createCheck, updateCheck } from "../../lib/server/github/Checks";
import { createComment, updateComment } from "../../lib/server/github/Comments";
import { findPullRequestForProjectAndUserAndBranch } from "../../lib/server/github/PullRequests";
import { getHTTPRequests, setupHook } from "../../lib/server/http-replay";
import { findGithubEventPullRequest } from "../../lib/server/supabase/functions/findGithubEventPullRequest";
import { snapshotsForGithubRun } from "../../lib/server/supabase/functions/snapshotsForGithubRun";
import { insertHTTPEvent } from "../../lib/server/supabase/storage/HttpEvents";
import {
  getBranchForProjectAndOrganizationAndBranchName,
  insertBranch,
} from "../../lib/server/supabase/tables/Branches";
import { insertGithubEvent } from "../../lib/server/supabase/tables/GithubEvents";
import { getProjectForOrganizationAndRepository } from "../../lib/server/supabase/tables/Projects";
import {
  getOpenPullRequestForBranch,
  insertPullRequest,
  updatePullRequest,
} from "../../lib/server/supabase/tables/PullRequests";
import {
  getRunForGithubRun,
  insertRun,
  updateRun,
} from "../../lib/server/supabase/tables/Runs";
import { GithubCheckId, GithubEventType, GithubRunId } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./constants";
import { ApiErrorResponse, ApiResponse, ApiSuccessResponse } from "./types";
import { createDiffComment } from "./updateBranchStatus";
import { isApiErrorResponse, sendApiResponse } from "./utils";

// Spy on HTTP client requests for debug logging in Supabase.
setupHook();

type LogAndSendResponseFunction = (
  projectOrganization: string | undefined,
  projectRepository: string,
  response: ApiResponse
) => Promise<void>;

export default async function handler(
  nextApiRequest: NextApiRequest,
  nextApiResponse: NextApiResponse<Response>
) {
  const eventType = nextApiRequest.headers["x-github-event"] as GithubEventType;

  async function logAndSendResponse(
    projectOrganization: string | undefined,
    projectRepository: string,
    apiResponse: ApiErrorResponse | ApiSuccessResponse
  ) {
    sendApiResponse(nextApiResponse, apiResponse);

    if (!projectOrganization) {
      return;
    }

    const project = await getProjectForOrganizationAndRepository(
      projectOrganization,
      projectRepository
    );

    const githubEvent = await insertGithubEvent({
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
      case "pull_request":
        // https://docs.github.com/webhooks-and-events/webhooks/webhook-events-and-payloads#pull_request
        const pullRequestEvent = nextApiRequest.body as PullRequestEvent;
        switch (pullRequestEvent.action) {
          case "closed":
            handlePullRequestClosedEvent(pullRequestEvent, logAndSendResponse);
            break;
          case "opened":
          case "reopened":
            handlePullRequestOpenedOrReopenedEvent(
              pullRequestEvent,
              logAndSendResponse
            );
            break;
          default:
            // Don't care about the other PR actions
            break;
        }
        break;
      case "workflow_job":
        // https://docs.github.com/webhooks-and-events/webhooks/webhook-events-and-payloads#workflow_job
        const workflowJobEvent = nextApiRequest.body as WorkflowJobEvent;
        switch (workflowJobEvent.action) {
          case "completed":
            handleWorkflowJobCompletedEvent(
              workflowJobEvent,
              logAndSendResponse
            );
            break;
          case "queued":
            handleWorkflowJobQueuedEvent(workflowJobEvent, logAndSendResponse);
            break;
          default:
            // Don't care about the other PR actions
            break;
        }
        break;
      default:
        // Don't care about other event types
        break;
    }
  } catch (error) {
    console.error(error);

    return sendApiResponse(nextApiResponse, {
      data: {
        message: "Internal server error",
      },
      deltaErrorCode: DELTA_ERROR_CODE.API.REQUEST_FAILED,
      httpStatusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
    });
  }

  // No-op response
  return sendApiResponse(nextApiResponse, {
    data: null,
    httpStatusCode: HTTP_STATUS_CODES.NO_CONTENT,
  });
}

async function handlePullRequestClosedEvent(
  event: PullRequestClosedEvent,
  logAndSendResponse: LogAndSendResponseFunction
) {
  if (!event.organization || !event.pull_request.head.repo) {
    return;
  }

  const prNumber = event.number;
  const organization = event.pull_request.head.repo.owner.login;
  const repository = event.pull_request.head.repo.name;

  const pullRequest = await findGithubEventPullRequest(
    organization,
    repository,
    prNumber
  );

  await updatePullRequest(pullRequest.id, {
    github_status: "closed",
  });

  const projectOrganization = event.organization.login;
  const projectRepository = event.repository.name;
  return logAndSendResponse(projectOrganization, projectRepository, {
    data: null,
    httpStatusCode: HTTP_STATUS_CODES.NO_CONTENT,
  });
}

async function handlePullRequestOpenedOrReopenedEvent(
  event: PullRequestOpenedEvent | PullRequestReopenedEvent,
  logAndSendResponse: LogAndSendResponseFunction
) {
  if (!event.organization || !event.pull_request.head.repo) {
    return;
  }

  const projectOrganization = event.organization.login;
  const projectRepository = event.repository.name;
  const project = await getProjectForOrganizationAndRepository(
    projectOrganization,
    projectRepository
  );

  const prNumber = event.number;
  const organization = event.pull_request.head.repo.owner.login;
  const repository = event.pull_request.head.repo.name;
  const branchName = event.pull_request.head.ref;
  let branch = await getBranchForProjectAndOrganizationAndBranchName(
    project.id,
    organization,
    branchName
  );
  if (branch == null) {
    branch = await insertBranch({
      name: branchName,
      organization,
      project_id: project.id,
    });
  }

  const pullRequest = await findGithubEventPullRequest(
    organization,
    repository,
    prNumber
  );
  if (pullRequest) {
    updatePullRequest(pullRequest.id, {
      github_status: "open",
    });
  } else {
    await insertPullRequest({
      branch_id: branch.id,
      github_check_id: null,
      github_comment_id: null,
      github_head_sha: event.pull_request.head.sha,
      github_pr_number: prNumber,
      github_status: "open",
    });
  }

  return logAndSendResponse(projectOrganization, projectRepository, {
    data: null,
    httpStatusCode: HTTP_STATUS_CODES.NO_CONTENT,
  });
}

async function handleWorkflowJobCompletedEvent(
  event: WorkflowJobCompletedEvent,
  logAndSendResponse: LogAndSendResponseFunction
) {
  if (!event.organization || !event.workflow_job.head_branch) {
    return;
  }

  const projectOrganization = event.organization.login;
  const projectRepository = event.repository.name;
  const branchName = event.workflow_job.head_branch;
  const project = await getProjectForOrganizationAndRepository(
    projectOrganization,
    projectRepository
  );

  // WorkflowJob events don't include enough information to identify the branch
  // We have to use the GitHub API to fill in the missing pieces
  const pullRequestJSON = await findPullRequestForProjectAndUserAndBranch(
    project,
    event.sender.login,
    branchName
  );
  const githubRunId = event.workflow_job.run_id as unknown as GithubRunId;
  const run = await getRunForGithubRun(githubRunId);
  if (run == null) {
    throw Error(`No Run found for GitHub run "${githubRunId}"`);
  }
  await updateRun(run.id, {
    github_status: "completed",
  });

  const organization = pullRequestJSON?.head.repo?.owner.login;
  if (organization == null) {
    return logAndSendResponse(projectOrganization, projectRepository, {
      data: new Error(
        `Could not find open pull request info for WorkflowJob ${event.workflow_job.id}`
      ),
      deltaErrorCode: DELTA_ERROR_CODE.API.REQUEST_FAILED,
      httpStatusCode: HTTP_STATUS_CODES.FAILED_DEPENDENCY,
    });
  }

  const branch = await getBranchForProjectAndOrganizationAndBranchName(
    project.id,
    organization,
    branchName
  );
  if (branch == null) {
    throw Error(
      `Could not find Branch for Project "${project.id}" and name "${name}" in organization "${organization}"`
    );
  }

  const pullRequest = await getOpenPullRequestForBranch(branch.id);
  if (pullRequest == null) {
    throw Error(`Could not find open PullRequests branch "${name}"`);
  }

  const newSnapshots = await snapshotsForGithubRun(githubRunId);
  const [comment, diff] = await createDiffComment({
    branchName,
    newSnapshots,
    project,
  });
  const numChanges = diff.length;

  const conclusion = numChanges > 0 ? "failure" : "success";
  const title = `${numChanges} snapshot changes from primary branch`;

  if (pullRequest.github_check_id) {
    await updateCheck(
      projectOrganization,
      projectRepository,
      pullRequest.github_check_id,
      {
        head_sha: event.workflow_job.head_sha,
        title,
        summary: "",
        conclusion,
        status: "completed",
        text: "",
      }
    );
  }

  if (pullRequest.github_comment_id == null) {
    await createComment(
      projectOrganization,
      projectRepository,
      pullRequest.github_pr_number,
      {
        body: comment,
      }
    );
  } else {
    await updateComment(
      projectOrganization,
      projectRepository,
      pullRequest.github_comment_id,
      {
        body: comment,
      }
    );
  }

  return logAndSendResponse(projectOrganization, projectRepository, {
    data: null,
    httpStatusCode: HTTP_STATUS_CODES.NO_CONTENT,
  });
}

async function handleWorkflowJobQueuedEvent(
  event: WorkflowJobQueuedEvent,
  logAndSendResponse: LogAndSendResponseFunction
) {
  if (!event.organization || !event.workflow_job.head_branch) {
    return;
  }

  const projectOrganization = event.organization.login;
  const projectRepository = event.repository.name;
  const branchName = event.workflow_job.head_branch;
  const project = await getProjectForOrganizationAndRepository(
    projectOrganization,
    projectRepository
  );

  // WorkflowJob events don't include enough information to identify the branch
  // We have to use the GitHub API to fill in the missing pieces
  const pullRequestJSON = await findPullRequestForProjectAndUserAndBranch(
    project,
    event.sender.login,
    branchName
  );
  const organization = pullRequestJSON?.head.repo?.owner.login;
  const pullRequestNumber = pullRequestJSON?.number;
  if (organization == null || pullRequestNumber == null) {
    return logAndSendResponse(projectOrganization, projectRepository, {
      data: new Error(
        `Could not find open pull request info for WorkflowJob ${event.workflow_job.id}`
      ),
      deltaErrorCode: DELTA_ERROR_CODE.API.REQUEST_FAILED,
      httpStatusCode: HTTP_STATUS_CODES.FAILED_DEPENDENCY,
    });
  }

  // Branch should have been created when the PR was opened/reopened
  const branch = (await getBranchForProjectAndOrganizationAndBranchName(
    project.id,
    organization,
    branchName
  ))!;

  const headSha = event.workflow_job.head_sha;

  let pullRequest = await getOpenPullRequestForBranch(branch.id);
  if (pullRequest == null) {
    pullRequest = await insertPullRequest({
      branch_id: branch.id,
      github_check_id: null,
      github_comment_id: null,
      github_head_sha: headSha,
      github_pr_number: pullRequestNumber,
      github_status: "open",
    });
  }

  await insertRun({
    delta_has_user_approval: false,
    github_status: "queued",
    github_actor: event.sender.login,
    github_run_id: event.workflow_job.run_id as unknown as GithubRunId,
    pull_request_id: pullRequest.id,
  });

  const check = await createCheck(projectOrganization, projectRepository, {
    head_sha: headSha,
    details_url: getDeltaBranchUrl(project, branchName),
    title: "Tests are running",
    status: "in_progress",
    text: "",
    summary: "",
  });

  await updatePullRequest(pullRequest.id, {
    github_check_id: check.id as unknown as GithubCheckId,
  });
}
