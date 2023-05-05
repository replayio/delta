import type { NextApiRequest, NextApiResponse } from "next";

import type {
  CheckSuiteEvent,
  PullRequestClosedEvent,
  PullRequestEvent,
  PullRequestOpenedEvent,
  PullRequestReopenedEvent,
} from "@octokit/webhooks-types";
import { getDeltaBranchUrl } from "../../lib/delta";
import { createCheck } from "../../lib/server/github/Checks";
import { getHTTPRequests, setupHook } from "../../lib/server/http-replay";
import { insertHTTPEvent } from "../../lib/server/supabase/storage/HttpEvents";
import {
  getBranchForProjectAndOrganizationAndBranchName,
  insertBranch,
  updateBranch,
} from "../../lib/server/supabase/tables/Branches";
import { insertGithubEvent } from "../../lib/server/supabase/tables/GithubEvents";
import { getProjectForOrganizationAndRepository } from "../../lib/server/supabase/tables/Projects";
import { GithubEventType } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./constants";
import { ApiErrorResponse, ApiResponse, ApiSuccessResponse } from "./types";
import { isApiErrorResponse, sendApiResponse } from "./utils";

// Spy on HTTP client requests for debug logging in Supabase.
setupHook();

type LogAndSendResponseFunction = (
  projectOrganization: string | undefined,
  projectRepository: string,
  action: string,
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

  let didRespond = false;

  try {
    switch (eventType) {
      case "check_suite": {
        // https://docs.github.com/webhooks-and-events/webhooks/webhook-events-and-payloads#check_suite
        const event = nextApiRequest.body as CheckSuiteEvent;
        if (event.check_suite.app.name === "Replay Delta") {
          didRespond = await handleCheckSuite(event, logAndSendResponse);
          break;
        }
        break;
      }
      case "pull_request": {
        // https://docs.github.com/webhooks-and-events/webhooks/webhook-events-and-payloads#pull_request
        const event = nextApiRequest.body as PullRequestEvent;
        switch (event.action) {
          case "closed":
            didRespond = await handlePullRequestClosedEvent(
              event,
              logAndSendResponse
            );
            break;
          case "opened":
          case "reopened":
            didRespond = await handlePullRequestOpenedOrReopenedEvent(
              event,
              logAndSendResponse
            );
            break;
          default:
            // Don't care about the other action types
            break;
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
    const event = nextApiRequest.body;
    const projectOrganization = event.organization?.login;
    const projectRepository = event.repository?.name;

    let project;
    if (projectOrganization && projectRepository) {
      project = await getProjectForOrganizationAndRepository(
        projectOrganization,
        projectRepository
      );
    }

    // Log all GitHub events for debugging purposes.
    // TODO Remove this eventually.
    await insertGithubEvent({
      action: nextApiRequest.body.action,
      payload: nextApiRequest.body,
      project_id: project?.id ?? null,
      type: eventType,
    });

    // No-op response
    return sendApiResponse(nextApiRequest, nextApiResponse, {
      data: null,
      httpStatusCode: HTTP_STATUS_CODES.NO_CONTENT,
    });
  }
}

async function handleCheckSuite(
  event: CheckSuiteEvent,
  logAndSendResponse: LogAndSendResponseFunction
): Promise<boolean> {
  if (!event.organization || !event.check_suite.head_branch) {
    return false;
  }

  const projectOrganization = event.organization.login;
  const projectRepository = event.repository.name;
  const project = await getProjectForOrganizationAndRepository(
    projectOrganization,
    projectRepository
  );

  const organization = event.repository.organization;
  const branchName = event.check_suite.head_branch;
  if (organization) {
    const prNumber =
      event.check_suite.pull_requests.length > 0
        ? event.check_suite.pull_requests[0].number
        : null;

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
        github_pr_check_id: null,
        github_pr_comment_id: null,
        github_pr_number: prNumber,
        github_pr_status: "open",
      });
    } else if (branch.github_pr_status === "closed") {
      updateBranch(branch.id, {
        github_pr_number: prNumber,
        github_pr_status: "open",
      });
    }
  }

  createCheck(projectOrganization, projectRepository, {
    conclusion: null,
    details_url: getDeltaBranchUrl(project, branchName),
    head_sha: event.check_suite.head_sha,
    title: "In progress",
    summary: "",
    text: "",
    status: "in_progress",
  });

  logAndSendResponse(projectOrganization, projectRepository, event.action, {
    data: null,
    httpStatusCode: HTTP_STATUS_CODES.NO_CONTENT,
  });

  return true;
}

async function handlePullRequestClosedEvent(
  event: PullRequestClosedEvent,
  logAndSendResponse: LogAndSendResponseFunction
): Promise<boolean> {
  if (!event.organization || !event.pull_request.head.repo) {
    return false;
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
  event: PullRequestOpenedEvent | PullRequestReopenedEvent,
  logAndSendResponse: LogAndSendResponseFunction
): Promise<boolean> {
  if (!event.organization || !event.pull_request.head.repo) {
    return false;
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
      github_pr_check_id: null,
      github_pr_comment_id: null,
      github_pr_number: prNumber,
      github_pr_status: "open",
    });
  } else if (branch.github_pr_status === "closed") {
    updateBranch(branch.id, {
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
