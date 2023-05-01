import type { NextApiRequest, NextApiResponse } from "next";

import { getRun } from "../../lib/server/supabase/runs";
import { getSnapshotsForRun } from "../../lib/server/supabase/snapshots";
import { ProjectId, RunId, Snapshot } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./statusCodes";
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
    return sendErrorResponseFromPostgrestError(
      response,
      runError,
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
      `Could not find Run with id "${runId}"`
    );
  } else if (runData == null) {
    return sendErrorResponse(
      response,
      `No run found with id "${runId}"`,
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED
    );
  }

  const { data: snapshotData, error: snapshotError } = await getSnapshotsForRun(
    runId
  );
  if (snapshotError) {
    return sendErrorResponseFromPostgrestError(
      response,
      snapshotError,
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED
    );
  } else if (!snapshotData) {
    return sendErrorResponse(
      response,
      `No snapshots found for run with id "${runId}"`,
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED
    );
  }

  return sendResponse<ResponseData>(response, snapshotData);
}
