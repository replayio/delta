import type { NextApiRequest, NextApiResponse } from "next";

import { createHash } from "crypto";
import { findPullRequestForProjectAndUserAndBranch } from "../../lib/server/github/PullRequests";
import { uploadSnapshot } from "../../lib/server/supabase/storage/Snapshots";
import { getProjectForSlug } from "../../lib/server/supabase/tables/Projects";
import { getPullRequestForGitHubPrNumber } from "../../lib/server/supabase/tables/PullRequests";
import { insertRun } from "../../lib/server/supabase/tables/Runs";
import { insertSnapshot } from "../../lib/server/supabase/tables/Snapshots";
import { GithubRunId, ProjectSlug } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./constants";
import { sendApiMissingParametersResponse, sendApiResponse } from "./utils";

export type Image = {
  base64: string;
  file: string;
};

export type RequestParams = {
  actor: string;
  branchName: string;
  images: Image[];
  owner: string;
  prNumber: string | undefined;
  projectSlug: ProjectSlug;
  runId: GithubRunId;
};
export type ResponseData = null;

// Note that this endpoint is used by the DevTools project's Playwright integration
// packages/replay-next/uploadSnapshots

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const {
    actor,
    branchName,
    owner,
    prNumber: prNumberString,
    projectSlug,
    runId: githubRunId,
  } = request.query as Partial<RequestParams>;
  const { images } = request.body as Partial<RequestParams>;
  if (
    !actor ||
    !branchName ||
    !images ||
    !owner ||
    !projectSlug ||
    !githubRunId
  ) {
    return sendApiMissingParametersResponse(response, {
      actor,
      branchName,
      images,
      owner,
      projectSlug,
      runId: githubRunId,
    });
  }

  let caught: Error | null = null;

  try {
    const project = await getProjectForSlug(projectSlug);

    let prNumber = prNumberString ? parseInt(prNumberString) : undefined;
    if (prNumber == null) {
      const githubPullRequest = await findPullRequestForProjectAndUserAndBranch(
        project,
        owner,
        branchName
      );
      if (githubPullRequest == null) {
        throw Error(
          `Could not find PR for Project "${projectSlug}", owner "${owner}", and branch "${branchName}"`
        );
      }

      prNumber = githubPullRequest.number;
    }

    const pullRequest = await getPullRequestForGitHubPrNumber(
      project.organization,
      project.repository,
      prNumber
    );

    for (let index = 0; index < images.length; index++) {
      const { base64, file } = images[index];

      try {
        console.log(
          `Uploading Snapshot for Project ${projectSlug}:\n ${base64}`
        );

        await uploadSnapshot(base64, project.id);

        const run = await insertRun({
          delta_has_user_approval: false,
          github_actor: actor,
          github_run_id: githubRunId,
          github_status: "completed",
          pull_request_id: pullRequest.id,
        });

        const sha = createHash("sha256").update(base64).digest("hex");
        const path = `${projectSlug}/${sha}.png`;

        console.log(
          `Inserting Snapshot with file "${file}" and path "${path}"`
        );

        await insertSnapshot({
          delta_file: file,
          delta_path: path,
          github_run_id: githubRunId,
          run_id: run.id,
        });
      } catch (error) {
        console.error(error);

        if (caught === null) {
          caught = error;
        }
      }
    }
  } catch (error) {
    console.error(error);

    if (caught === null) {
      caught = error;
    }
  }

  if (caught) {
    return sendApiResponse(response, {
      data: caught,
      deltaErrorCode: DELTA_ERROR_CODE.STORAGE.DOWNLOAD_FAILED,
      httpStatusCode: HTTP_STATUS_CODES.NOT_FOUND,
    });
  } else {
    return sendApiResponse(response, {
      data: null,
      httpStatusCode: HTTP_STATUS_CODES.OK,
    });
  }
}