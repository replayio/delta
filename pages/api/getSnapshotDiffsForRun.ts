import type { NextApiRequest, NextApiResponse } from "next";

import diffSnapshot from "../../lib/server/diffSnapshot";
import { getPrimaryBranchForProject } from "../../lib/server/supabase/tables/Branches";
import { getProjectForRun } from "../../lib/server/supabase/tables/Projects";
import {
  getMostRecentSuccessfulRunForBranch,
  getRunForId,
} from "../../lib/server/supabase/tables/Runs";
import { getSnapshotsForRun } from "../../lib/server/supabase/tables/Snapshots";
import { SnapshotDiff } from "../../lib/server/types";
import { RunId, Snapshot } from "../../lib/types";
import mergeSnapshots from "../../utils/snapshots";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./constants";
import { sendApiMissingParametersResponse, sendApiResponse } from "./utils";

export type RequestParams = {
  runId: string;
};
export type ResponseData = SnapshotDiff[];

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const { runId } = request.query as RequestParams;
  if (!runId) {
    return sendApiMissingParametersResponse(request, response, {
      runId,
    });
  }

  try {
    const run = await getRunForId(parseInt(runId) as unknown as RunId);
    const project = await getProjectForRun(run.id);

    const primaryBranch = await getPrimaryBranchForProject(project);
    const primaryBranchRun = await getMostRecentSuccessfulRunForBranch(
      primaryBranch.id
    );

    const oldSnapshots = primaryBranchRun
      ? await getSnapshotsForRun(primaryBranchRun.id)
      : [];
    const newSnapshots = await getSnapshotsForRun(run.id);

    const data = await diffSnapshots(oldSnapshots, newSnapshots);

    return sendApiResponse<ResponseData>(request, response, {
      httpStatusCode: HTTP_STATUS_CODES.OK,
      data,
    });
  } catch (error) {
    return sendApiResponse(request, response, {
      data: error,
      deltaErrorCode: DELTA_ERROR_CODE.STORAGE.DOWNLOAD_FAILED,
      httpStatusCode: HTTP_STATUS_CODES.NOT_FOUND,
    });
  }
}

async function diffSnapshots(
  oldSnapshots: Snapshot[],
  newSnapshots: Snapshot[]
): Promise<SnapshotDiff[]> {
  const map = mergeSnapshots(oldSnapshots, newSnapshots);

  const promises: Promise<void>[] = [];
  const diffs: SnapshotDiff[] = [];
  const files = Array.from(map.keys());
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    const value = map.get(file)!;

    promises.push(
      diffSnapshot(value.old, value.new).then((diff) => {
        if (diff !== null) {
          diffs.push(diff);
        }
      })
    );
  }

  await Promise.all(promises);

  return diffs;
}
