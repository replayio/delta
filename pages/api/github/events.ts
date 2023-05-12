import type { NextApiRequest, NextApiResponse } from "next";

import type {
  PullRequestEvent,
  WorkflowJobEvent,
  WorkflowRunEvent,
} from "@octokit/webhooks-types";
import { setupHook } from "../../../lib/server/http-replay";
import { getBranchForProjectAndOrganizationAndBranchName } from "../../../lib/server/supabase/tables/Branches";
import { insertGithubEvent } from "../../../lib/server/supabase/tables/GithubEvents";
import { getProjectForOrganizationAndRepository } from "../../../lib/server/supabase/tables/Projects";
import { Branch, GithubEventType, Project } from "../../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "../constants";
import { sendApiResponse } from "../utils";
import {
  getParamsFromPullRequestClosedEvent,
  handlePullRequestClosedEvent,
} from "./_handlePullRequestClosedEvent";
import {
  getParamsFromPullRequestOpenedOrReopenedEvent,
  handlePullRequestOpenedOrReopenedEvent,
} from "./_handlePullRequestOpenedOrReopenedEvent";
import {
  getParamsFromWorkflowRunCompleted,
  handleWorkflowRunCompleted,
} from "./_handleWorkflowRunCompleted";
import {
  getParamsFromWorkflowRunInProgress,
  handleWorkflowRunInProgress,
} from "./_handleWorkflowRunInProgress";

// Spy on HTTP client requests for debug logging in Supabase.
setupHook();

export default async function handler(
  nextApiRequest: NextApiRequest,
  nextApiResponse: NextApiResponse<Response>
) {
  const eventType = nextApiRequest.headers["x-github-event"] as GithubEventType;

  console.log(`Received GitHub event type: "${eventType}"`);

  let didRespond = false;
  let didThrow = false;
  let logEvent = false;

  let branchName: string | null = null;
  let organization: string | null = null;
  let projectOrganization: string | null = null;
  let projectRepository: string | null = null;

  try {
    switch (eventType) {
      case "pull_request": {
        // https://docs.github.com/webhooks-and-events/webhooks/webhook-events-and-payloads#pull_request
        const event = nextApiRequest.body as PullRequestEvent;
        switch (event.action) {
          case "closed": {
            logEvent = true;

            const extracted = getParamsFromPullRequestClosedEvent(event);
            branchName = extracted.branchName;
            organization = extracted.organization;
            projectOrganization = extracted.projectOrganization;
            projectRepository = extracted.projectRepository;

            didRespond = await handlePullRequestClosedEvent(event);
            break;
          }
          case "opened":
          case "reopened": {
            logEvent = true;

            const extracted =
              getParamsFromPullRequestOpenedOrReopenedEvent(event);
            branchName = extracted.branchName;
            organization = extracted.organization;
            projectOrganization = extracted.projectOrganization;
            projectRepository = extracted.projectRepository;

            didRespond = await handlePullRequestOpenedOrReopenedEvent(event);
            break;
          }
          default: {
            // Don't care about the other action types
            break;
          }
        }
        break;
      }
      case "workflow_job": {
        // https://docs.github.com/webhooks-and-events/webhooks/webhook-events-and-payloads#workflow_job
        const event = nextApiRequest.body as WorkflowJobEvent;
        if (event.workflow_job.workflow_name === "Delta") {
          logEvent = true;
        }
        break;
      }
      case "workflow_run": {
        // https://docs.github.com/webhooks-and-events/webhooks/webhook-events-and-payloads#workflow_run
        const event = nextApiRequest.body as WorkflowRunEvent;
        if (event.workflow?.name === "Delta") {
          switch (event.action) {
            case "completed": {
              logEvent = true;

              const extracted = getParamsFromWorkflowRunCompleted(event);
              branchName = extracted.branchName;
              organization = extracted.organization;
              projectOrganization = extracted.projectOrganization;
              projectRepository = extracted.projectRepository;

              didRespond = await handleWorkflowRunCompleted(event);
              break;
            }
            case "in_progress": {
              logEvent = true;

              const extracted = getParamsFromWorkflowRunInProgress(event);
              branchName = extracted.branchName;
              organization = extracted.organization;
              projectOrganization = extracted.projectOrganization;
              projectRepository = extracted.projectRepository;

              didRespond = await handleWorkflowRunInProgress(event);
              break;
            }
            default: {
              // Don't care about the other action types
              break;
            }
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

    didThrow = true;
  }

  if (logEvent) {
    let branch: Branch | undefined = undefined;
    let project: Project | undefined = undefined;
    try {
      if (projectOrganization && projectRepository) {
        project = await getProjectForOrganizationAndRepository(
          projectOrganization,
          projectRepository
        );

        if (branchName && organization) {
          branch = await getBranchForProjectAndOrganizationAndBranchName(
            project.id,
            organization,
            branchName
          );
        }
      }
    } catch (error) {}

    await insertGithubEvent({
      action: nextApiRequest.body.action,
      branch_id: branch?.id ?? null,
      handled: didRespond,
      payload: nextApiRequest.body,
      project_id: project?.id ?? null,
      threw: didThrow,
      type: eventType,
    });
  }

  if (didThrow) {
    sendApiResponse(nextApiRequest, nextApiResponse, {
      data: {
        message: "Internal server error",
      },
      deltaErrorCode: DELTA_ERROR_CODE.API.REQUEST_FAILED,
      httpStatusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
    });
  } else if (!didRespond) {
    return sendApiResponse(nextApiRequest, nextApiResponse, {
      data: null,
      httpStatusCode: HTTP_STATUS_CODES.NO_CONTENT,
    });
  }
}
