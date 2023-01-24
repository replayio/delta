import type { NextApiRequest, NextApiResponse } from "next";

import { getSnapshotFromBranch } from "../../lib/server/supabase/snapshots";
import { downloadSnapshot } from "../../lib/server/supabase/storage";
import { diffWithPrimaryBranch } from "../../lib/server/diffWithPrimaryBranch";
import { updateSnapshot } from "../../lib/server/supabase/snapshots";
import { isPostgrestError } from "../../lib/server/supabase/errors";
import {
  GenericResponse,
  sendErrorResponseFromPostgrestError,
  sendErrorResponse,
  sendResponse,
  sendErrorMissingParametersResponse,
} from "./utils";

export type RequestParams = {
  branchName: string;
  projectId: string;
  snapshotFile: string;
};
export type ResponseData = string;
export type Response = GenericResponse<ResponseData>;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const { branchName, projectId, snapshotFile } =
    request.query as RequestParams;
  if (!branchName || !projectId || !snapshotFile) {
    return sendErrorMissingParametersResponse(response, {
      branchName,
      projectId,
      snapshotFile,
    });
  }

  const { data: snapshotData, error: snapshotError } =
    await getSnapshotFromBranch(snapshotFile, projectId, branchName);
  if (snapshotError) {
    return isPostgrestError(snapshotError)
      ? sendErrorResponseFromPostgrestError(response, snapshotError)
      : sendErrorResponse(response, snapshotError.message);
  } else if (!snapshotData) {
    return sendErrorResponse(response, "Could not download snapshot data");
  }

  if (snapshotData.primary_diff_path) {
    const { data, error } = await downloadSnapshot(
      snapshotData.primary_diff_path
    );
    if (error) {
      return sendErrorResponse(response, error.message);
    } else if (!data) {
      return sendErrorResponse(
        response,
        "Could not download snapshot primary diff",
        404
      );
    }

    response.setHeader("Content-Type", "image/png");
    return sendResponse<ResponseData>(response, data);
  }

  const imageRes = await downloadSnapshot(snapshotData.path);
  const diff = await diffWithPrimaryBranch(projectId, branchName, {
    file: snapshotFile,
    content: imageRes.data || "",
  });
  if (diff.error || !diff.png) {
    return sendErrorResponse(response, diff.error || "Could not create diff");
  }

  // Save the primary_diff_path to the snapshot if it exists
  if (diff.diffSnapshot?.path) {
    const updatedSnapshot = await updateSnapshot(snapshotData.id, {
      primary_diff_path: diff.diffSnapshot.path,
      primary_num_pixels: diff.numPixels,
      primary_changed: diff.changed,
    });
    if (updatedSnapshot.error) {
      return sendErrorResponse(response, "Failed to update snapshot diff");
    }
  }

  return sendResponse<ResponseData>(response, diff.png.toString());
}
