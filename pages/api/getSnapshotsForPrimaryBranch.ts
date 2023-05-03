import type { NextApiRequest, NextApiResponse } from "next";

import { latestSnapshotsForPrimaryBranch } from "../../lib/server/supabase/functions/latestSnapshotsForPrimaryBranch";
import { ProjectId, Snapshot } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./constants";
import { sendApiMissingParametersResponse, sendApiResponse } from "./utils";

export type RequestParams = {
  projectId: ProjectId;
};
export type ResponseData = Snapshot[];

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { projectId } = request.query as RequestParams;
  if (!projectId) {
    return sendApiMissingParametersResponse(response, {
      projectId,
    });
  }

  try {
    const data = await latestSnapshotsForPrimaryBranch(projectId);
    return sendApiResponse<ResponseData>(response, {
      httpStatusCode: HTTP_STATUS_CODES.OK,
      data,
    });
  } catch (error) {
    return sendApiResponse(response, {
      data: error,
      deltaErrorCode: DELTA_ERROR_CODE.STORAGE.DOWNLOAD_FAILED,
      httpStatusCode: HTTP_STATUS_CODES.NOT_FOUND,
    });
  }
}
