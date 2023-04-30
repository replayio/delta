import type { NextApiRequest, NextApiResponse } from "next";

import { getSnapshotsForPrimaryBranch } from "../../lib/server/supabase/snapshots";
import { ProjectId, Snapshot } from "../../lib/types";
import {
  GenericResponse,
  sendErrorMissingParametersResponse,
  sendErrorResponse,
  sendErrorResponseFromPostgrestError,
  sendResponse,
} from "./utils";

export type RequestParams = {
  projectId: ProjectId;
};
export type ResponseData = Snapshot[];
export type Response = GenericResponse<ResponseData>;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { projectId } = request.query as RequestParams;
  if (!projectId) {
    return sendErrorMissingParametersResponse(response, {
      projectId,
    });
  }

  const { data, error } = await getSnapshotsForPrimaryBranch(projectId);

  if (error) {
    return typeof error === "string"
      ? sendErrorResponse(response, error)
      : sendErrorResponseFromPostgrestError(response, error);
  } else if (!data) {
    return sendErrorResponse(
      response,
      `No primary branch snapshots found for project "${projectId}"`,
      404
    );
  } else {
    return sendResponse<ResponseData>(response, data);
  }
}
