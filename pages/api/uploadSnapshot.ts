import type { NextApiRequest, NextApiResponse } from "next";

import { createHash } from "crypto";
import { uploadSnapshot } from "../../lib/server/supabase/storage/Snapshots";
import { getRunForGithubRun } from "../../lib/server/supabase/tables/Runs";
import { insertSnapshot } from "../../lib/server/supabase/tables/Snapshots";
import { GithubRunId, ProjectId, Snapshot } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./constants";
import { sendApiMissingParametersResponse, sendApiResponse } from "./utils";

export type Image = {
  content: string;
  file: string;
};

export type RequestParams = {
  branchName: string;
  image: Image;
  projectId: ProjectId;
  runId: GithubRunId;
};
export type ResponseData = Snapshot;

// Note that this endpoint is used by the DevTools project's Playwright integration
// packages/replay-next/uploadSnapshots

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const {
    branchName,
    projectId,
    runId: githubRunId,
  } = request.query as Partial<RequestParams>;
  const { image } = request.body as Partial<RequestParams>;
  if (!branchName || !image || !projectId || !githubRunId) {
    return sendApiMissingParametersResponse(response, {
      branchName,
      image,
      projectId,
      runId: githubRunId,
    });
  }

  try {
    console.log(
      `Uploading Snapshot for Project ${projectId}:\n ${image.content}`
    );

    await uploadSnapshot(image.content, projectId);

    const run = await getRunForGithubRun(githubRunId);

    const sha = createHash("sha256").update(image.content).digest("hex");
    const path = `${projectId}/${sha}.png`;

    console.log(
      `Inserting Snapshot with file "${image.file}" and path "${path}"`
    );

    const newSnapshot = await insertSnapshot({
      delta_file: image.file,
      delta_path: path,
      github_run_id: githubRunId,
      run_id: run.id,
    });

    // We used to eagerly compute this, but this too easily gets stale
    // Now we compute it on demand (either in response to a GitHub event hook or Delta web app request)

    return sendApiResponse(response, {
      data: newSnapshot,
      httpStatusCode: HTTP_STATUS_CODES.OK,
    });
  } catch (error) {
    console.error(error);

    return sendApiResponse(response, {
      data: error,
      deltaErrorCode: DELTA_ERROR_CODE.STORAGE.DOWNLOAD_FAILED,
      httpStatusCode: HTTP_STATUS_CODES.NOT_FOUND,
    });
  }
}
