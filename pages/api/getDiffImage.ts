import type { NextApiRequest, NextApiResponse } from "next";

import { diffBase64Images } from "../../lib/server/diff";
import { downloadSnapshot } from "../../lib/server/supabase/storage/Snapshots";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./constants";
import { sendApiMissingParametersResponse, sendApiResponse } from "./utils";

export type RequestParams = {
  pathA: string;
  pathB: string;
};
export type ResponseData = string | null;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { pathA, pathB } = request.query as RequestParams;
  if (!pathA || !pathB) {
    return sendApiMissingParametersResponse(request, response, {
      pathA,
      pathB,
    });
  }

  try {
    const imageA = await downloadSnapshot(pathA);
    const imageB = await downloadSnapshot(pathB);
    const diff = await diffBase64Images(imageA, imageB);

    let data = diff.png ? diff.png.toString("base64") : null;

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
