import type { NextApiRequest, NextApiResponse } from "next";

import { getRun } from "../../lib/server/supabase/runs";
import { getSnapshotsForJob } from "../../lib/server/supabase/snapshots";
import { RunId, ProjectId, Snapshot } from "../../lib/types";
import {
  GenericResponse,
  sendErrorMissingParametersResponse,
  sendErrorResponse,
  sendErrorResponseFromPostgrestError,
  sendResponse,
} from "./utils";

export type RequestParams = {
  runId: RunId;
  projectId: ProjectId;
};
export type ResponseData = Snapshot[];
export type Response = GenericResponse<ResponseData>;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { runId, projectId } = request.query as RequestParams;
  if (!runId || !projectId) {
    return sendErrorMissingParametersResponse(response, {
      runId,
      projectId,
    });
  }

  const { data: runData, error: runError } = await getRun(runId);
  if (runError) {
    return sendErrorResponseFromPostgrestError(response, runError);
  } else if (runData == null) {
    return sendErrorResponse(response, `No run found with id "${runId}"`, 404);
  }

  const { data: snapshotData, error: snapshotError } = await getSnapshotsForJob(
    runId
  );
  if (snapshotError) {
    return sendErrorResponseFromPostgrestError(response, snapshotError);
  } else if (!snapshotData) {
    return sendErrorResponse(
      response,
      `No snapshots found for run id "${runId}"`,
      404
    );
  }

  return sendResponse<ResponseData>(response, snapshotData);
}
