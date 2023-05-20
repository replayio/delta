import type { NextApiRequest, NextApiResponse } from "next";

import { createHash } from "crypto";
import { uploadSnapshot } from "../../lib/server/supabase/storage/Snapshots";
import { getRunForGithubRunId } from "../../lib/server/supabase/tables/Runs";
import { insertSnapshotVariant } from "../../lib/server/supabase/tables/SnapshotVariants";
import { insertSnapshot } from "../../lib/server/supabase/tables/Snapshots";
import { GithubRunId, ProjectSlug } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./constants";
import { sendApiMissingParametersResponse, sendApiResponse } from "./utils";

type Base64String = string;
type RequestQueryParams = {
  actor: string;
  branchName: string;
  owner: string;
  prNumber: string | undefined;
  projectSlug: ProjectSlug;
  runId: GithubRunId;
};
type RequestBody = {
  metadata: {
    imageFilename: string;
    testFilename: string;
    testName: string;
  };
  variants: {
    [variant: string]: Base64String;
  };
};

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
  } = request.query as Partial<RequestQueryParams>;
  const { metadata, variants } = request.body as Partial<RequestBody>;
  const { imageFilename, testFilename, testName } = metadata ?? {};
  if (
    !actor ||
    !branchName ||
    !githubRunId ||
    !owner ||
    !projectSlug ||
    !imageFilename ||
    !testFilename ||
    !testName ||
    !variants ||
    Object.keys(variants).length === 0
  ) {
    return sendApiMissingParametersResponse(request, response, {
      actor,
      branchName,
      metadata,
      owner,
      projectSlug,
      runId: githubRunId,
      variants,
    });
  }

  try {
    const run = await getRunForGithubRunId(githubRunId);

    console.group(`Inserting Snapshot for Project ${projectSlug}`);

    const snapshot = await insertSnapshot({
      delta_image_filename: imageFilename,
      delta_test_filename: testFilename,
      delta_test_name: testName,
      github_run_id: githubRunId,
      run_id: run.id,
    });

    for (let variant in variants) {
      const base64 = variants[variant];

      const sha = createHash("sha256").update(base64).digest("hex");
      const path = `${projectSlug}/${sha}.png`;

      console.groupCollapsed(
        `Uploading snapshot variant "${variant}" to path "${path}"`
      );
      console.log(base64);
      console.groupEnd();

      await uploadSnapshot(path, base64);

      console.log(`Inserting SnapshotVariant for Snapshot ${snapshot.id}`);

      await insertSnapshotVariant({
        delta_variant: variant,
        snapshot_id: snapshot.id,
        supabase_path: path,
      });
    }

    console.groupEnd();

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
