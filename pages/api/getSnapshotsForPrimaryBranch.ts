import type { NextApiRequest, NextApiResponse } from "next";

import { getPrimaryBranchForProject } from "../../lib/server/supabase/tables/Branches";
import { getProjectForId } from "../../lib/server/supabase/tables/Projects";
import { getMostRecentRunForBranch } from "../../lib/server/supabase/tables/Runs";
import { getSnapshotsForGithubRun } from "../../lib/server/supabase/tables/Snapshots";
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
    const project = await getProjectForId(projectId);
    const primaryBranch = await getPrimaryBranchForProject(project);
    const primaryBranchRun = await getMostRecentRunForBranch(primaryBranch.id);

    const data = await getSnapshotsForGithubRun(primaryBranchRun.id);
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
