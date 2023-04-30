import type { NextApiRequest, NextApiResponse } from "next";

import { getSnapshotsForBranch } from "../../lib/server/supabase/snapshots";
import { ProjectId, Snapshot } from "../../lib/types";
import {
  GenericResponse,
  sendErrorMissingParametersResponse,
  sendErrorResponse,
  sendErrorResponseFromPostgrestError,
  sendResponse,
} from "./utils";

export type RequestParams = {
  branchName: string;
  projectId: ProjectId;
};
export type ResponseData = Snapshot[];
export type Response = GenericResponse<ResponseData>;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { branchName, projectId } = request.query as RequestParams;
  if (!branchName || !projectId) {
    return sendErrorMissingParametersResponse(response, {
      branchName,
      projectId,
    });
  }

  const { data, error } = await getSnapshotsForBranch(projectId, branchName);

  if (error) {
    return typeof error === "string"
      ? sendErrorResponse(response, error)
      : sendErrorResponseFromPostgrestError(response, error);
  } else if (!data) {
    return sendErrorResponse(
      response,
      `No snapshots found for project "${projectId}" and branch "${branchName}"`,
      404
    );
  } else {
    return sendResponse<ResponseData>(response, data);
  }
}
