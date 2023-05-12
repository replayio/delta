import type { NextApiRequest, NextApiResponse } from "next";

import { createHash } from "crypto";
import { uploadSnapshot } from "../../lib/server/supabase/storage/Snapshots";
import { getRunsForGithubRunId } from "../../lib/server/supabase/tables/Runs";
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
    actor,
    branchName,
    owner,
    projectSlug,
    runId: githubRunId,
  } = request.query as Partial<RequestParams>;
  const { image } = request.body as Partial<RequestParams>;
  if (
    !actor ||
    !branchName ||
    !image ||
    !owner ||
    !projectSlug ||
    !githubRunId
  ) {
    return sendApiMissingParametersResponse(request, response, {
      actor,
      branchName,
      image,
      owner,
      projectSlug,
      runId: githubRunId,
    });
  }

  try {
    const run = await getRunsForGithubRunId(githubRunId);

    const { base64, file } = image;

    console.log(`Uploading Snapshot for Project ${projectSlug}:\n ${base64}`);

    const sha = createHash("sha256").update(base64).digest("hex");
    const path = `${projectSlug}/${sha}.png`;

    await uploadSnapshot(path, base64);

    console.log(`Inserting Snapshot with file "${file}" and path "${path}"`);

    await insertSnapshot({
      delta_file: file,
      delta_path: path,
      github_run_id: githubRunId,
      run_id: run.id,
    });

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
