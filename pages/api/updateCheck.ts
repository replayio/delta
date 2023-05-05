import type { NextApiRequest, NextApiResponse } from "next";

import diffSnapshots from "../../lib/server/diffSnapshots";
import { updateCheck } from "../../lib/server/github/Checks";
import {
  getBranchForProjectAndOrganizationAndBranchName,
  getPrimaryBranchForProject,
} from "../../lib/server/supabase/tables/Branches";
import { getProjectForSlug } from "../../lib/server/supabase/tables/Projects";
import {
  getMostRecentRunForBranch,
  getRunsForGithubRunId,
} from "../../lib/server/supabase/tables/Runs";
import { getSnapshotsForRun } from "../../lib/server/supabase/tables/Snapshots";
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
  image: Image;
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
    branchName,
    owner,
    projectSlug,
    runId: githubRunId,
  } = request.query as Partial<RequestParams>;
  if (!branchName || !owner || !projectSlug || !githubRunId) {
    return sendApiMissingParametersResponse(request, response, {
      branchName,
      owner,
      projectSlug,
      runId: githubRunId,
    });
  }

  try {
    const project = await getProjectForSlug(projectSlug);
    const branch = await getBranchForProjectAndOrganizationAndBranchName(
      project.id,
      owner,
      branchName
    );
    if (branch == null) {
      throw Error(
        `No branches found for project ${project.id} and owner "${owner}" with name "${branchName}"`
      );
    }

    const run = await getRunsForGithubRunId(githubRunId);

    const primaryBranch = await getPrimaryBranchForProject(project);
    const primaryBranchRun = await getMostRecentRunForBranch(primaryBranch.id);

    const oldSnapshots = await getSnapshotsForRun(primaryBranchRun.id);
    const newSnapshots = await getSnapshotsForRun(run.id);

    const data = await diffSnapshots(oldSnapshots, newSnapshots);

    updateCheck(
      project.organization,
      project.repository,
      branch.github_pr_check_id,
      {
        conclusion: data.length > 0 ? "failure" : "success",
        status: "completed",
      }
    );

    return sendApiResponse(request, response, {
      data: null,
      httpStatusCode: HTTP_STATUS_CODES.OK,
    });
  } catch (error) {
    console.error(error);

    return sendApiResponse(request, response, {
      data: error,
      deltaErrorCode: DELTA_ERROR_CODE.STORAGE.DOWNLOAD_FAILED,
      httpStatusCode: HTTP_STATUS_CODES.NOT_FOUND,
    });
  }
}
