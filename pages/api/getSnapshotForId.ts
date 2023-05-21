import type { NextApiRequest, NextApiResponse } from "next";

import { getSnapshotForId } from "../../lib/server/supabase/tables/Snapshots";
import { Snapshot, SnapshotId } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./constants";
import { sendApiMissingParametersResponse, sendApiResponse } from "./utils";

export type RequestParams = {
  snapshotId: SnapshotId;
};
export type ResponseData = Snapshot;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { snapshotId } = request.query as RequestParams;
  if (!snapshotId) {
    return sendApiMissingParametersResponse(request, response, {
      snapshotId,
    });
  }

  try {
    const data = await getSnapshotForId(snapshotId);

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
