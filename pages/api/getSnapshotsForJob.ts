import type { NextApiRequest, NextApiResponse } from "next";

import { getActionsForJob } from "../../lib/server/supabase/actions";
import { getJob } from "../../lib/server/supabase/jobs";
import { getSnapshotsForJob } from "../../lib/server/supabase/snapshots";
import { JobId, ProjectId, Snapshot } from "../../lib/types";
import {
  GenericResponse,
  sendErrorMissingParametersResponse,
  sendErrorResponse,
  sendErrorResponseFromPostgrestError,
  sendResponse,
} from "./utils";

export type RequestParams = {
  jobId: JobId;
  projectId: ProjectId;
};
export type ResponseData = Snapshot[];
export type Response = GenericResponse<ResponseData>;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { jobId, projectId } = request.query as RequestParams;
  if (!jobId || !projectId) {
    return sendErrorMissingParametersResponse(response, {
      jobId,
      projectId,
    });
  }

  const { data: jobData, error: jobError } = await getJob(jobId);
  if (jobError) {
    return sendErrorResponseFromPostgrestError(response, jobError);
  } else if (jobData == null) {
    return sendErrorResponse(response, `No job found with id "${jobId}"`, 404);
  }

  const { data: actionsData, error: actionsError } = await getActionsForJob(
    jobId
  );
  if (actionsError) {
    return sendErrorResponseFromPostgrestError(response, actionsError);
  } else if (actionsData == null) {
    return sendErrorResponse(
      response,
      `No actions found for job id "${jobId}"`,
      404
    );
  }

  const { data: snapshotData, error: snapshotError } = await getSnapshotsForJob(
    jobId
  );
  if (snapshotError) {
    return sendErrorResponseFromPostgrestError(response, snapshotError);
  } else if (!snapshotData) {
    return sendErrorResponse(
      response,
      `No snapshots found for job id "${jobId}"`,
      404
    );
  }

  return sendResponse<ResponseData>(response, snapshotData);
}
