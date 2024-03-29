import type { NextApiRequest, NextApiResponse } from "next";

import { createHash } from "crypto";
import { diffBase64Images } from "../../lib/server/diff";
import {
  downloadSnapshot,
  uploadSnapshot,
} from "../../lib/server/supabase/storage/Snapshots";
import { getPrimaryBranchForProject } from "../../lib/server/supabase/tables/Branches";
import { getProjectForRun } from "../../lib/server/supabase/tables/Projects";
import {
  getMostRecentSuccessfulRunForBranch,
  getRunForGithubRunId,
} from "../../lib/server/supabase/tables/Runs";
import {
  getSnapshotVariantsForSnapshot,
  insertSnapshotVariant,
} from "../../lib/server/supabase/tables/SnapshotVariants";
import {
  getSnapshot,
  insertSnapshot,
} from "../../lib/server/supabase/tables/Snapshots";
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
    recordingId: string | null;
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
  const { imageFilename, recordingId, testFilename, testName } = metadata ?? {};
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

    const snapshot = await getSnapshot(
      run.id,
      testFilename,
      testName,
      imageFilename
    );
    if (snapshot) {
      return sendApiResponse(request, response, {
        data: null,
        httpStatusCode: HTTP_STATUS_CODES.OK,
      });
    }

    const project = await getProjectForRun(run.id);

    const primaryBranch = await getPrimaryBranchForProject(project);
    const primaryBranchRun = await getMostRecentSuccessfulRunForBranch(
      primaryBranch.id
    );

    console.group(
      `Finding most recent snapshots for branch "${primaryBranch.name}" and run ${primaryBranchRun?.id}`
    );

    const oldSnapshot = primaryBranchRun
      ? await getSnapshot(
          primaryBranchRun.id,
          testFilename,
          testName,
          imageFilename
        )
      : null;
    const oldSnapshotVariants = oldSnapshot
      ? await getSnapshotVariantsForSnapshot(oldSnapshot.id)
      : [];

    console.group(`Inserting Snapshot for Project ${projectSlug}`);

    const newSnapshot = await insertSnapshot({
      delta_image_filename: imageFilename,
      delta_test_filename: testFilename,
      delta_test_name: testName,
      github_run_id: githubRunId,
      replay_recording_id: recordingId ?? null,
      run_id: run.id,
    });

    for (let variant in variants) {
      const base64 = variants[variant];

      const sha = createHash("sha256").update(base64).digest("hex");
      const path = `${projectSlug}/${sha}.png`;

      let supabasePath: string | null = null;

      // Images are de-duped using paths derived from a base64 representation
      // It's possible for the same image to produce multiple base64 representations
      // To avoid these false positives, we should do a verification diff before uploading
      // See stackoverflow.com/questions/30429168/is-a-base64-encoded-string-unique
      const prevVariant = oldSnapshotVariants.find(
        (snapshotVariant) => snapshotVariant.delta_variant === variant
      );
      if (prevVariant) {
        if (path === prevVariant.supabase_path) {
          supabasePath = path;
        } else {
          const prevBase64 = await downloadSnapshot(prevVariant.supabase_path);
          const { changed } = await diffBase64Images(prevBase64, base64);
          if (!changed) {
            supabasePath = prevVariant.supabase_path;
          }
        }
      }

      if (supabasePath === null) {
        console.groupCollapsed(
          `Uploading snapshot variant "${variant}" to path "${path}"`
        );
        console.log(base64);
        console.groupEnd();

        supabasePath = path;

        await uploadSnapshot(path, base64);
      }

      console.log(`Inserting SnapshotVariant for Snapshot ${newSnapshot.id}`);

      await insertSnapshotVariant({
        delta_variant: variant,
        snapshot_id: newSnapshot.id,
        supabase_path: supabasePath,
      });
    }

    console.groupEnd();

    console.log("Done!");

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
