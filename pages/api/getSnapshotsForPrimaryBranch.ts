import type { NextApiRequest, NextApiResponse } from "next";

import { getSnapshotsForPrimaryBranch } from "../../lib/server/supabase/snapshots";
import { ProjectId, Snapshot } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./statusCodes";
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
    const message = `Could not find primary Branch Snapshots for Project id "${projectId}"`;
    return typeof error === "string"
      ? sendErrorResponse(
          response,
          error,
          HTTP_STATUS_CODES.NOT_FOUND,
          DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
          message
        )
      : sendErrorResponseFromPostgrestError(
          response,
          error,
          HTTP_STATUS_CODES.NOT_FOUND,
          DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
          message
        );
  } else if (!data) {
    return sendErrorResponse(
      response,
      `No primary branch snapshots found for project "${projectId}"`,
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED
    );
  } else {
    return sendResponse<ResponseData>(response, data);
  }
}
