import type { NextApiRequest, NextApiResponse } from "next";

import omit from "lodash/omit";
import {
  createCheck,
  createComment,
  updateCheck,
  updateComment,
} from "../../lib/github";

import { getDeltaBranchUrl } from "../../lib/delta";
import { getHTTPRequests, setupHook } from "../../lib/server/http-replay";
import {
  getBranchForProject,
  getBranchForPullRequest,
  insertBranch,
  updateBranch,
} from "../../lib/server/supabase/branches";
import {
  insertHTTPEvent,
  insertGithubEvent,
  updateGithubEvent,
} from "../../lib/server/supabase/httpEvent";
import {
  getRunForGithubRun,
  insertRun,
  updateRun,
} from "../../lib/server/supabase/runs";
import { getProjectForOrganizationAndRepository } from "../../lib/server/supabase/projects";
import { getSnapshotsForGithubRun } from "../../lib/server/supabase/snapshots";
import {
  CheckId,
  Project,
  GithubRunId,
  Snapshot,
  GithubJobId,
  GithubEvent,
} from "../../lib/types";
import {
  ErrorLike,
  GenericResponse,
  createErrorMessageFromPostgrestError,
  sendErrorResponse,
  sendResponse,
} from "./utils";
import {
  DELTA_ERROR_CODE,
  DeltaErrorCode,
  HTTP_STATUS_CODES,
  HttpStatusCode,
} from "./statusCodes";

// Spy on HTTP client requests for debug logging in Supabase.
setupHook();

// Note that this endpoint is used by the Delta GitHub app.
//
// Partial type information below is based on analyzing actual events as well as the docs below:
// https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads

type CommonGitHubParams = {
  action: string;
  organization: {
    id: number;
    login: string;
  };
  repository: {
    id: number;
    name: string;
  };
  sender: {
    id: number;
    login: string;
  };
};

export type PullRequestEventParams = CommonGitHubParams & {
  action: "closed" | "opened";
  number: number;
  pull_request: {
    head: {
      ref: string;
    };
    title: string;
  };
};

export type JobEventParams = CommonGitHubParams & {
  action: "completed" | "queued";
  workflow_job: {
    head_branch: string;
    id: number;
    head_sha: string;
    run_id: number;
    workflow_name: string;
  };
};

export type ResponseData = string | null;
export type Response = GenericResponse<ResponseData>;

type LogAndSendResponse = (
  httpStatusCode?: HttpStatusCode,
  deltaErrorCode?: DeltaErrorCode,
  data?: ResponseData | null,
  error?: ErrorLike | string | null
) => Promise<void>;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const {
    action: actionType,
    organization,
    repository,
  } = request.body as CommonGitHubParams;

  // Name of the event that triggered the delivery.
  const eventType = request.headers["x-github-event"] as string;

  // Helper thats logs debug information to Supabase before sending an HTTP response.
  const logAndSendResponse: LogAndSendResponse = async (
    httpStatusCode: HttpStatusCode,
    deltaErrorCode: DeltaErrorCode,
    data: ResponseData | null = null,
    error: ErrorLike | string | null = null
  ) => {
    const githubEventId = githubEvent?.data?.id ?? null;
    const projectId = project?.data?.id ?? null;
    if (githubEventId != null && projectId != null) {
      await insertHTTPEvent(githubEventId, projectId, {
        request: {
          body: request.body,
          method: request.method,
          query: request.query,
          rawHeaders: request.rawHeaders,
          url: request.url,
        },
        response: {
          code: httpStatusCode,
          data,
          error,
        },

        // Recorded using Node's "async_hooks"; see setupHook()
        requests: getHTTPRequests(),
      });
    }

    if (error !== null) {
      await sendErrorResponse(response, error, httpStatusCode, deltaErrorCode);
    } else {
      await sendResponse<ResponseData>(response, data, httpStatusCode);
    }
  };

  let branchName: string | undefined = undefined;
  let headSha: string | undefined = undefined;
  let prNumber: string | undefined = undefined;
  let githubRunId: GithubRunId | undefined = undefined;
  let githubJobId: GithubJobId | undefined = undefined;
  if (isPullRequestEventParams(request.body)) {
    const { pull_request: pullRequest, number } = request.body;
    branchName = pullRequest.head.ref;
    prNumber = "" + number;
  } else if (isJobEventParams(request.body)) {
    const { workflow_job: workflowJob } = request.body;
    branchName = workflowJob.head_branch;
    headSha = workflowJob.head_sha;
    githubJobId = workflowJob.id as unknown as GithubJobId;
    githubRunId = workflowJob.run_id as unknown as GithubRunId;
  }

  // HTTP metadata is used for debug logging only; if it fails, ignore it (for now)
  const githubEvent = await insertGithubEvent({
    action: actionType,
    branch_name: branchName,
    event_type: eventType,
    head_sha: headSha,
    payload: request.body,
    pr_number: prNumber,
    github_run_id: githubRunId,
    github_job_id: githubJobId,
  });
  if (githubEvent.error) {
    console.error(githubEvent.error);
  }

  const project = await getProjectForOrganizationAndRepository(
    organization.login,
    repository.name
  );
  if (project.error) {
    return await logAndSendResponse(
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
      null,
      `No project found for repository "${repository.name}" and organization "${organization.login}"\n\n${project.error.code}: ${project.error.message}`
    );
  }

  switch (eventType) {
    // https://docs.github.com/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#pull_request
    case "pull_request": {
      switch (actionType) {
        case "closed":
          return handlePullRequestClosed(
            project.data,
            request.body as PullRequestEventParams,
            logAndSendResponse
          );
        case "opened":
          return handlePullRequestOpened(
            project.data,
            request.body as PullRequestEventParams,
            logAndSendResponse
          );
      }
      break;
    }
    // https://docs.github.com/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#workflow_job
    case "workflow_job": {
      switch (actionType) {
        case "completed":
          return handleWorkflowCompleted(
            project.data,
            request.body as JobEventParams,
            logAndSendResponse
          );
        case "queued":
          return handleWorkflowQueued(
            project.data,
            request.body as JobEventParams,
            logAndSendResponse,
            githubEvent.data
          );
      }
      break;
    }
  }

  return await logAndSendResponse(
    HTTP_STATUS_CODES.NO_CONTENT,
    DELTA_ERROR_CODE.API.UNHANDLED_EVENT_TYPE,
    `Ignoring event type "${eventType}"`,
    null
  );
}

export function formatCheck(check: Object): Partial<Object> {
  return omit(check, ["app", "pull_requests"]);
}

export function formatComment({
  project,
  branchName,
  snapshots,
  subTitle = "",
}: {
  project: Project;
  branchName: string;
  snapshots: Snapshot[];
  subTitle?: string;
}) {
  const deltaUrl = getDeltaBranchUrl(project, branchName);

  const numDifferent = snapshots.filter(
    (snapshot) => snapshot.primary_diff_path != null
  ).length;

  const snapshotList = snapshots
    .filter((snapshot) => snapshot.primary_diff_path != null)
    .slice(0, 10)
    .map(
      (snapshot) =>
        `<details>
          <summary>${
            snapshot.file.split("/")[snapshot.file.split("/").length - 1]
          }</summary>
          <img src="https://delta.replay.io/api/snapshot?path=${
            snapshot.path
          }" />
        </details>`
    )
    .join("\n");

  const title =
    numDifferent > 0
      ? `${numDifferent} of ${snapshots.length} changed`
      : "Nothing changed";
  return [
    `**<a href="${deltaUrl}">${title}</a>** ${subTitle}`,
    snapshotList,
  ].join("\n");
}

async function handlePullRequestClosed(
  project: Project,
  params: PullRequestEventParams,
  logAndSendResponse: LogAndSendResponse
) {
  const { number } = params;

  let branch = await getBranchForPullRequest(project.id, number);
  if (branch.error) {
    return logAndSendResponse(
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
      null,
      createErrorMessageFromPostgrestError(branch.error)
    );
  } else if (!branch.data) {
    return logAndSendResponse(
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
      null,
      `Could not find branch for PR ${number}`
    );
  }

  branch = await updateBranch(branch.data.id, {
    status: "closed",
  });
  if (branch.error) {
    return logAndSendResponse(
      HTTP_STATUS_CODES.FAILED_DEPENDENCY,
      DELTA_ERROR_CODE.DATABASE.UPDATE_FAILED,
      null,
      createErrorMessageFromPostgrestError(branch.error)
    );
  } else {
    return logAndSendResponse();
  }
}

async function handlePullRequestOpened(
  project: Project,
  params: PullRequestEventParams,
  logAndSendResponse: LogAndSendResponse
) {
  const { number, organization, pull_request: pullRequest } = params;

  const branch = await insertBranch({
    name: pullRequest.head.ref,
    organization: organization.login,
    pr_number: number,
    project_id: project.id,
    status: "open",
  });
  if (branch.error) {
    return logAndSendResponse(
      HTTP_STATUS_CODES.FAILED_DEPENDENCY,
      DELTA_ERROR_CODE.DATABASE.INSERT_FAILED,
      null,
      createErrorMessageFromPostgrestError(branch.error)
    );
  } else {
    return logAndSendResponse();
  }
}

async function handleWorkflowCompleted(
  project: Project,
  params: JobEventParams,
  logAndSendResponse: LogAndSendResponse
) {
  const { organization, repository, workflow_job: workflowJob } = params;

  const branchName = workflowJob.head_branch;

  let branch = await getBranchForProject(project.id, branchName);
  if (branch.error) {
    return logAndSendResponse(
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
      null,
      createErrorMessageFromPostgrestError(branch.error)
    );
  } else if (!branch.data) {
    return logAndSendResponse(
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
      null,
      `Could not find branch with name "${branchName}"`
    );
  }

  if (!branch.data.check_id) {
    return logAndSendResponse(
      HTTP_STATUS_CODES.EXPECTATION_FAILED,
      DELTA_ERROR_CODE.INVALID_STATE,
      null,
      `Branch ${branch.data.name} is missing check`
    );
  }

  const runId = ("" + workflowJob.run_id) as GithubRunId;

  const snapshots = await getSnapshotsForGithubRun(runId);
  if (snapshots.error) {
    return logAndSendResponse(
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
      null,
      createErrorMessageFromPostgrestError(snapshots.error)
    );
  } else if (!snapshots.data) {
    return logAndSendResponse(
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
      null,
      `Could not find snapshots for run run ${runId}`
    );
  }

  const numDifferent = snapshots.data.filter(
    (snapshot) =>
      snapshot.primary_diff_path != null && snapshot.primary_num_pixels > 0
  ).length;
  const conclusion = numDifferent > 0 ? "failure" : "success";
  const title = `${numDifferent} of ${snapshots.data.length} snapshots are different`;

  if (branch.data.check_id) {
    await updateCheck(
      organization.login,
      repository.name,
      branch.data.check_id,
      {
        head_sha: workflowJob.head_sha,
        title,
        summary: "",
        conclusion,
        status: "completed",
        text: "",
      }
    );
  }

  // Leave a PR comment if there are snapshot differences.
  // Note that we should only leave one.
  let comment;
  if (numDifferent > 0 && !branch.data.comment_id) {
    comment = await createComment(
      organization.login,
      repository.name,
      branch.data.pr_number
    );
    if (!comment.id) {
      console.error("Create comment error:\n", comment);
      return logAndSendResponse(
        HTTP_STATUS_CODES.FAILED_DEPENDENCY,
        DELTA_ERROR_CODE.API.REQUEST_FAILED,
        null,
        {
          message: "Create comment failed",
          details: comment,
        }
      );
    }

    branch = await updateBranch(branch.data.id, {
      comment_id: comment.id,
    });
    if (branch.error) {
      return logAndSendResponse(
        HTTP_STATUS_CODES.FAILED_DEPENDENCY,
        DELTA_ERROR_CODE.DATABASE.UPDATE_FAILED,
        null,
        createErrorMessageFromPostgrestError(branch.error)
      );
    }
  }

  if (branch.data.comment_id) {
    comment = await updateComment(
      organization.login,
      repository.name,
      branch.data.comment_id,
      {
        body: formatComment({
          branchName,
          project,
          snapshots: snapshots.data,
        }),
      }
    );
    if (!comment.id) {
      console.error("Update comment error:\n", comment);
      return logAndSendResponse(
        HTTP_STATUS_CODES.FAILED_DEPENDENCY,
        DELTA_ERROR_CODE.API.REQUEST_FAILED,
        null,
        {
          message: "Update comment failed",
          details: comment,
        }
      );
    }
  }

  const run = await getRunForGithubRun(runId);
  if (run.error) {
    return logAndSendResponse(
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
      null,
      createErrorMessageFromPostgrestError(run.error)
    );
  } else if (!run.data) {
    return logAndSendResponse(
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
      null,
      `Could not find job for run run ${runId}`
    );
  }

  const updatedJob = await updateRun(run.data.id, {
    status: conclusion,
  });
  if (updatedJob.error) {
    return logAndSendResponse(
      HTTP_STATUS_CODES.FAILED_DEPENDENCY,
      DELTA_ERROR_CODE.DATABASE.UPDATE_FAILED,
      null,
      createErrorMessageFromPostgrestError(updatedJob.error)
    );
  }

  return logAndSendResponse();
}

async function handleWorkflowQueued(
  project: Project,
  params: JobEventParams,
  logAndSendResponse: LogAndSendResponse,
  githubEvent: GithubEvent | null
) {
  const {
    organization,
    repository,
    sender,
    workflow_job: workflowJob,
  } = params;

  const {
    head_branch: branchName,
    head_sha: headSha,
    run_id: runId,
    workflow_name: workflowName,
  } = workflowJob;

  // HACK This check ignores non-Delta actions but it relies on a particular naming convention.
  if (!workflowName.startsWith("Playwright Snapshot")) {
    return await logAndSendResponse(
      HTTP_STATUS_CODES.NO_CONTENT,
      DELTA_ERROR_CODE.API.UNHANDLED_WORKFLOW_TYPE,
      `Ignoring workflow job "${workflowName}"`,
      null
    );
  }

  let branch = await getBranchForProject(project.id, branchName);
  if (branch.error) {
    return logAndSendResponse(
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
      null,
      createErrorMessageFromPostgrestError(branch.error)
    );
  } else if (!branch.data) {
    return logAndSendResponse(
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
      null,
      `Could not find branch with name "${branchName}"`
    );
  }

  const check = await createCheck(organization.login, repository.name, {
    head_sha: headSha,
    details_url: getDeltaBranchUrl(project, branchName),
    title: "Tests are running",
    status: "in_progress",
    text: "",
    summary: "",
  });

  if (githubEvent) {
    await updateGithubEvent(githubEvent, { check });
  }

  branch = await updateBranch(branch.data.id, {
    check_id: check.id != null ? (("" + check.id) as CheckId) : undefined,
    head_sha: headSha,
  });
  if (branch.error) {
    return logAndSendResponse(
      HTTP_STATUS_CODES.FAILED_DEPENDENCY,
      DELTA_ERROR_CODE.DATABASE.UPDATE_FAILED,
      null,
      createErrorMessageFromPostgrestError(branch.error)
    );
  }
  const branchId = branch.data.id;

  let run = await getRunForGithubRun(runId as unknown as GithubRunId);
  if (!run.data) {
    run = await insertRun({
      actor: sender.login,
      branch_id: branchId,
      num_snapshots: 0,
      num_snapshots_changed: 0,
      github_run_id: runId as unknown as GithubRunId,
      status: "neutral",
    });
    if (run.error) {
      return logAndSendResponse(
        HTTP_STATUS_CODES.FAILED_DEPENDENCY,
        DELTA_ERROR_CODE.DATABASE.INSERT_FAILED,
        null,
        createErrorMessageFromPostgrestError(run.error)
      );
    } else if (!run.data) {
      return logAndSendResponse(
        HTTP_STATUS_CODES.FAILED_DEPENDENCY,
        DELTA_ERROR_CODE.DATABASE.INSERT_FAILED,
        null,
        `Could not insert Run for GitHub run id ${runId}`
      );
    }
  }
}

function isPullRequestEventParams(
  params: any
): params is PullRequestEventParams {
  return params.action === "opened" || params.action === "closed";
}

function isJobEventParams(params: any): params is JobEventParams {
  return params.action === "completed" || params.action === "queued";
}
