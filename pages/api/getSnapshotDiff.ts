import type { NextApiRequest, NextApiResponse } from "next";

import { diffWithPrimaryBranch } from "../../lib/server/diffWithPrimaryBranch";
import { isPostgrestError } from "../../lib/server/errors";
import {
  getSnapshotForBranch,
  updateSnapshot,
} from "../../lib/server/supabase/snapshots";
import { downloadSnapshot } from "../../lib/server/supabase/storage";
import { ProjectId } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./statusCodes";
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
    await getSnapshotForBranch(projectId, branchName, snapshotFile);
  if (snapshotError) {
    const message = `Could not find Snapshot for Project id "${projectId}" and Branch "${branchName}" and file "${snapshotFile}"`;
    return isPostgrestError(snapshotError)
      ? sendErrorResponseFromPostgrestError(
          response,
          snapshotError,
          HTTP_STATUS_CODES.NOT_FOUND,
          DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
          message
        )
      : sendErrorResponse(
          response,
          snapshotError.message,
          HTTP_STATUS_CODES.NOT_FOUND,
          DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
          message
        );
  } else if (!snapshotData) {
    return sendErrorResponse(
      response,
      "No data returned",
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
      `Could not find Snapshot for Project id "${projectId}" and Branch "${branchName}" and file "${snapshotFile}"`
    );
  }

  let changed = false;
  if (!snapshotData.primary_diff_path) {
    // Exists in primary branch but deleted in this branch
    changed = true;
  } else {
    const { data, error } = await downloadSnapshot(
      snapshotData.primary_diff_path
    );
    if (error) {
      return sendErrorResponse(
        response,
        error.message,
        HTTP_STATUS_CODES.NOT_FOUND,
        DELTA_ERROR_CODE.STORAGE.DOWNLOAD_FAILED,
        `Snapshot download failed for path "${snapshotData.primary_diff_path}"`
      );
    } else if (!data) {
      return sendErrorResponse(
        response,
        "No data returned",
        HTTP_STATUS_CODES.NOT_FOUND,
        DELTA_ERROR_CODE.STORAGE.DOWNLOAD_FAILED,
        `Snapshot download failed for path "${snapshotData.primary_diff_path}"`
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
    return sendErrorResponse(
      response,
      diff.error || `Error`,
      HTTP_STATUS_CODES.FAILED_DEPENDENCY,
      DELTA_ERROR_CODE.DIFF_FAILED,
      `Diff creation failed for Project id ${projectId} and Branch "${branchName}"`
    );
  }

  // Save the primary_diff_path to the snapshot if it exists
  if (diff.changed && diff.diffSnapshot?.path) {
    const updatedSnapshot = await updateSnapshot(snapshotData.id, {
      primary_diff_path: diff.diffSnapshot.path,
    });
    if (updatedSnapshot.error) {
      return sendErrorResponse(
        response,
        `Could not upload diff for Snapshot id "${snapshotData.id}"`,
        HTTP_STATUS_CODES.FAILED_DEPENDENCY,
        DELTA_ERROR_CODE.STORAGE.UPLOAD_FAILED
      );
    }
  }

  return sendResponse<ResponseData>(response, diff.png.toString());
}
