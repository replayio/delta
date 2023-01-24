import type { NextApiRequest, NextApiResponse } from "next";

import createClient from "../../lib/initServerSupabase";
import {
  createCheck,
  updateCheck,
  createComment,
  updateComment,
} from "../../lib/github";
import omit from "lodash/omit";

import {
  getProjectFromRepo,
  Project,
  Snapshot,
} from "../../lib/server/supabase/supabase";
import {
  HTTPMetadata,
  insertHTTPEvent,
  insertHTTPMetadata,
  updateHTTPMetadata,
} from "../../lib/server/supabase/httpEvent";
import {
  getBranchFromProject,
  getBranchFromPr,
  insertBranch,
  updateBranch,
} from "../../lib/server/supabase/branches";
import {
  getActionFromRunId,
  updateAction,
} from "../../lib/server/supabase/actions";
import { getSnapshotsForAction } from "../../lib/server/supabase/snapshots";
import { getDeltaBranchUrl } from "../../lib/delta";
import { getHTTPRequests, setupHook } from "../../lib/server/http-replay";
import {
  GenericResponse,
  sendErrorResponse,
  sendResponse,
  createErrorMessageFromPostgrestError,
} from "./utils";

const supabase = createClient();

// Spy on HTTP client requests for debug logging in Supabase.
setupHook();

// Note that this endpoint is used by the Delta GitHub app.

// Partial type information below is based on:
// https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads

export type RequestParams = {
  action: "closed" | "completed" | "opened" | "queued";
  number: number;
  organization: {
    login: string;
  };
  pull_request: {
    head: {
      ref: string;
    };
    title: string;
  };
  repository: {
    name: string;
  };
  sender: {
    login: string;
  };
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
  data?: ResponseData | null,
  error?: string | null,
  code?: number
) => Promise<void>;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const {
    action: actionType,
    number,
    organization,
    pull_request: pullRequest,
    repository,
    workflow_job: workflowJob,
  } = request.body as RequestParams;

  // Name of the event that triggered the delivery.
  const eventType = request.headers["x-github-event"] as string;

  // Helper thats logs debug information to Supabase before sending an HTTP response.
  const logAndSendResponse: LogAndSendResponse = async (
    data: ResponseData | null = null,
    error: string | null = null,
    code?: number
  ) => {
    const httpMetadataId = httpMetadata?.data?.id ?? null;
    const projectId = project?.data?.id ?? null;
    if (httpMetadataId != null && projectId != null) {
      await insertHTTPEvent(httpMetadataId, projectId, {
        request,
        response: {
          code,
          data,
          error,
        },

        // Recorded using Node's "async_hooks"; see setupHook()
        requests: getHTTPRequests(),
      });
    }

    if (error !== null) {
      await sendErrorResponse(response, error, code);
    } else {
      await sendResponse<ResponseData>(response, data, code);
    }
  };

  // HTTP metadata is used for debug logging only; if it fails, ignore it (for now)
  const httpMetadata = await insertHTTPMetadata({
    action: actionType,
    branch_name: workflowJob?.head_branch || pullRequest?.head?.ref,
    event_type: eventType,
    head_sha: workflowJob?.head_sha,
    job_id: "" + workflowJob?.id,
    payload: request.body,
    pr_number: "" + number,
    run_id: "" + workflowJob?.run_id,
  });
  if (httpMetadata.error) {
    console.error(httpMetadata.error);
  }

  const project = await getProjectFromRepo(repository.name, organization.login);
  if (project.error) {
    return await logAndSendResponse(
      null,
      `No project found for repository "${repository.name}" and organization "${organization.login}"`,
      404
    );
  }

  switch (eventType) {
    // https://docs.github.com/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#pull_request
    case "pull_request": {
      switch (actionType) {
        case "closed":
          return handlePullRequestClosed(
            project.data,
            request.body as RequestParams,
            logAndSendResponse
          );
        case "opened":
          return handlePullRequestOpened(
            project.data,
            request.body as RequestParams,
            logAndSendResponse
          );
      }
      break;
    }
    // https://docs.github.com/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#workflow_job
    case "workflow_job": {
      // HACK This check ignores non-Delta actions but it relies on a particular naming convention.
      if (!workflowJob.workflow_name.startsWith("Playwright Snapshot")) {
        return await logAndSendResponse(
          `Ignoring workflow job "${workflowJob.workflow_name}"`,
          null,
          204
        );
      }

      switch (actionType) {
        case "completed":
          return handleWorkflowCompleted(
            project.data,
            request.body as RequestParams,
            logAndSendResponse
          );
        case "queued":
          return handleWorkflowQueued(
            project.data,
            request.body as RequestParams,
            logAndSendResponse,
            httpMetadata.data
          );
      }
      break;
    }
  }

  return await logAndSendResponse(
    `Ignoring event type "${eventType}"`,
    null,
    204
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
    (snapshot) => snapshot.primary_changed
  ).length;

  const snapshotList = snapshots
    .filter((snapshot) => snapshot.primary_changed)
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
  params: RequestParams,
  logAndSendResponse: LogAndSendResponse
) {
  const { number } = params;

  let branch = await getBranchFromPr(project.id, number);
  if (branch.error) {
    return logAndSendResponse(
      null,
      createErrorMessageFromPostgrestError(branch.error)
    );
  } else if (!branch.data) {
    return logAndSendResponse(
      null,
      `Could not find branch for PR ${number}`,
      404
    );
  }

  branch = await updateBranch(branch.data.id, {
    status: "closed",
  });
  if (branch.error) {
    return logAndSendResponse(
      null,
      createErrorMessageFromPostgrestError(branch.error)
    );
  } else {
    return logAndSendResponse();
  }
}

async function handlePullRequestOpened(
  project: Project,
  params: RequestParams,
  logAndSendResponse: LogAndSendResponse
) {
  const { number, pull_request: pullRequest } = params;

  const branch = await insertBranch({
    name: pullRequest.head.ref,
    project_id: project.id,
    pr_title: pullRequest.title,
    pr_number: "" + number,
    status: "open",
  });
  if (branch.error) {
    return logAndSendResponse(
      null,
      createErrorMessageFromPostgrestError(branch.error)
    );
  } else {
    return logAndSendResponse();
  }
}

async function handleWorkflowCompleted(
  project: Project,
  params: RequestParams,
  logAndSendResponse: LogAndSendResponse
) {
  const { organization, repository, workflow_job: workflowJob } = params;

  const branchName = workflowJob.head_branch;

  let branch = await getBranchFromProject(project.id, branchName);
  if (branch.error) {
    return logAndSendResponse(
      null,
      createErrorMessageFromPostgrestError(branch.error)
    );
  } else if (!branch.data) {
    return logAndSendResponse(
      null,
      `Could not find branch with name "${branchName}"`,
      404
    );
  }

  if (!branch.data.check_id) {
    return logAndSendResponse(
      null,
      `Branch ${branch.data.name} is missing check`,
      417
    );
  }

  const runId = "" + workflowJob.run_id;
  const action = await getActionFromRunId(runId);
  if (action.error) {
    return logAndSendResponse(
      null,
      createErrorMessageFromPostgrestError(action.error)
    );
  } else if (!action.data) {
    return logAndSendResponse(
      null,
      `Could not find action for run ${runId}`,
      404
    );
  }

  const actionId = action.data.id;
  const snapshots = await getSnapshotsForAction(actionId);
  if (snapshots.error) {
    return logAndSendResponse(
      null,
      createErrorMessageFromPostgrestError(snapshots.error)
    );
  } else if (!snapshots.data) {
    return logAndSendResponse(
      null,
      `Could not find snapshots for run action ${actionId}`,
      404
    );
  }

  const numDifferent = snapshots.data.filter(
    (snapshot) => snapshot.primary_changed
  ).length;
  const conclusion = numDifferent > 0 ? "failure" : "success";
  const title = `${numDifferent} of ${snapshots.data.length} snapshots are different`;

  let updatedCheck;
  if (branch.data.check_id) {
    updatedCheck = await updateCheck(
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
    if (comment.status != 201) {
      return logAndSendResponse(null, "Could not create comment");
    }

    branch = await updateBranch(branch.data.id, {
      comment_id: comment.data.id,
    });
    if (branch.error) {
      return logAndSendResponse(
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
    if (comment.status != 200) {
      return logAndSendResponse(null, "Could not update comment");
    }
  }

  const updatedAction = await updateAction(action.data.id, {
    status: conclusion,
  });
  if (updatedAction.error) {
    return logAndSendResponse(
      null,
      createErrorMessageFromPostgrestError(updatedAction.error)
    );
  }

  return logAndSendResponse();
}

async function handleWorkflowQueued(
  project: Project,
  params: RequestParams,
  logAndSendResponse: LogAndSendResponse,
  httpMetadata: HTTPMetadata | null
) {
  const {
    organization,
    repository,
    sender,
    workflow_job: workflowJob,
  } = params;

  const branchName = workflowJob.head_branch;

  let branch = await getBranchFromProject(project.id, branchName);
  if (branch.error) {
    return logAndSendResponse(
      null,
      createErrorMessageFromPostgrestError(branch.error)
    );
  } else if (!branch.data) {
    return logAndSendResponse(
      null,
      `Could not find branch with name "${branchName}"`,
      404
    );
  }

  const check = await createCheck(organization.login, repository.name, {
    head_sha: workflowJob.head_sha,
    details_url: getDeltaBranchUrl(project, branchName),
    title: "Tests are running",
    status: "in_progress",
    text: "",
    summary: "",
  });

  if (httpMetadata) {
    await updateHTTPMetadata(httpMetadata, { check });
  }

  branch = await updateBranch(branch.data.id, {
    check_id: check.id != null ? "" + check.id : undefined,
    head_sha: workflowJob.head_sha,
  });
  if (branch.error) {
    return logAndSendResponse(
      null,
      createErrorMessageFromPostgrestError(branch.error)
    );
  }

  const action = await supabase
    .from("Actions")
    .insert({
      run_id: workflowJob.run_id,
      branch_id: branch.data.id,
      head_sha: workflowJob.head_sha,
      actor: sender.login,
      status: "neutral",
    })
    .single();
  if (action.error) {
    return logAndSendResponse(
      null,
      createErrorMessageFromPostgrestError(action.error)
    );
  } else {
    return logAndSendResponse();
  }
}
