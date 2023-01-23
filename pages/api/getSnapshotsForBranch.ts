import type { NextApiRequest, NextApiResponse } from "next";

import { getSnapshotsFromBranch } from "../../lib/server/supabase/snapshots";
import { Snapshot } from "../../lib/server/supabase/supabase";
import {
  GenericResponse,
  sendErrorResponseFromPostgrestError,
  sendErrorResponse,
  sendResponse,
} from "./utils";

export type RequestParams = {
  branchName: string;
  projectId: string;
};
export type ResponseData = Snapshot[];
export type Response = GenericResponse<ResponseData>;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { branchName, projectId } = request.query as RequestParams;
  if (!branchName || !projectId) {
    return sendErrorResponse(
      response,
      'Missing required param(s) "branchName" or "projectId"',
      422
    );
  }

  const { data, error } = await getSnapshotsFromBranch(projectId, branchName);

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
