import type { NextApiRequest, NextApiResponse } from "next";

import { diffWithPrimaryBranch } from "../../lib/server/diffWithPrimaryBranch";
import { getBranchByName } from "../../lib/server/supabase/branches";
import { isPostgrestError } from "../../lib/server/supabase/errors";
import {
  getRunForBranch,
  incrementNumSnapshotsChanged,
} from "../../lib/server/supabase/runs";
import {
  getSnapshotForBranch,
  insertSnapshot,
  updateSnapshot,
} from "../../lib/server/supabase/snapshots";
import { uploadSnapshot } from "../../lib/server/supabase/storage";
import {
  GithubRunId,
  ProjectId,
  Snapshot,
  SnapshotStatus,
} from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./statusCodes";
import {
  GenericResponse,
  sendErrorMissingParametersResponse,
  sendErrorResponse,
  sendErrorResponseFromPostgrestError,
  sendResponse,
} from "./utils";

export type Image = {
  content: string;
  file: string;
};

export type RequestParams = {
  branchName: string;
  image: Image;
  projectId: ProjectId;
  runId: GithubRunId;
};
export type ResponseData = Snapshot;
export type Response = GenericResponse<ResponseData>;

// Note that this endpoint is used by the DevTools project's Playwright integration
// packages/replay-next/uploadSnapshots

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { branchName, projectId, runId } =
    request.query as Partial<RequestParams>;
  const { image } = request.body as Partial<RequestParams>;
  if (!branchName || !image || !projectId || !runId) {
    return sendErrorMissingParametersResponse(response, {
      branchName,
      image,
      projectId,
      runId,
    });
  }

  try {
    console.log("Uploading snapshot");
    const uploadResult = await uploadSnapshot(image.content, projectId);

    // Duplicates will fail to upload, but that's okay.
    const uploadStatus: SnapshotStatus = uploadResult.error
      ? "Duplicate"
      : "Uploaded";

    console.log("Inserting snapshot");
    const insertedSnapshot = await insertSnapshot(
      branchName,
      projectId,
      image,
      runId,
      uploadStatus
    );
    if (insertedSnapshot.error) {
      const message = `Insert Snapshot failed for project id "${projectId}" and Branch "${branchName}"`;
      return typeof insertedSnapshot.error === "string"
        ? sendErrorResponse(
            response,
            insertedSnapshot.error,
            HTTP_STATUS_CODES.FAILED_DEPENDENCY,
            DELTA_ERROR_CODE.DATABASE.INSERT_FAILED,
            message
          )
        : sendErrorResponseFromPostgrestError(
            response,
            insertedSnapshot.error,
            HTTP_STATUS_CODES.FAILED_DEPENDENCY,
            DELTA_ERROR_CODE.DATABASE.INSERT_FAILED,
            message
          );
    }

    let snapshot: Snapshot | null = insertedSnapshot.data;
    if (!snapshot) {
      console.log("Getting previous snapshot");
      const previousSnapshot = await getSnapshotForBranch(
        projectId,
        branchName,
        image.file
      );
      if (previousSnapshot.error) {
        const message = `Select previous Snapshot failed for project id "${projectId}" and Branch "${branchName}"`;
        return isPostgrestError(previousSnapshot.error)
          ? sendErrorResponseFromPostgrestError(
              response,
              previousSnapshot.error,
              HTTP_STATUS_CODES.NOT_FOUND,
              DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
              message
            )
          : sendErrorResponse(
              response,
              previousSnapshot.error.message,
              HTTP_STATUS_CODES.NOT_FOUND,
              DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
              message
            );
      }

      snapshot = previousSnapshot.data ?? null;
    }

    if (snapshot === null) {
      return sendErrorResponse(
        response,
        "Could not find snapshot",
        HTTP_STATUS_CODES.NOT_FOUND,
        DELTA_ERROR_CODE.UNKNOWN_ERROR
      );
    }

    console.log("Diffing snapshots");
    const primaryDiff = await diffWithPrimaryBranch(
      projectId,
      branchName,
      image
    );

    if (primaryDiff.changed && primaryDiff.diffSnapshot?.path) {
      console.log("Updating snapshot");

      const updatedSnapshot = await updateSnapshot(snapshot.id, {
        primary_diff_path: primaryDiff.diffSnapshot?.path,
        primary_num_pixels:
          primaryDiff.numPixels != null ? primaryDiff.numPixels : 0,
      });
      if (updatedSnapshot.error) {
        return sendErrorResponseFromPostgrestError(
          response,
          updatedSnapshot.error,
          HTTP_STATUS_CODES.FAILED_DEPENDENCY,
          DELTA_ERROR_CODE.DATABASE.UPDATE_FAILED,
          `Could not update Snapshot id "${snapshot.id}"`
        );
      }

      const branch = await getBranchByName(branchName);
      if (branch.error) {
        return branch.error;
      }

      const run = await getRunForBranch(branch.data.id, runId);
      if (run.error) {
        return run.error;
      }

      await incrementNumSnapshotsChanged(run.data.id);

      return sendResponse<ResponseData>(response, updatedSnapshot.data);
    }

    return sendResponse<ResponseData>(response, snapshot);
  } catch (error) {
    console.error("uploadSnapshot caught error:", error);
    return sendErrorResponse(
      response,
      error ?? "Error",
      HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
      DELTA_ERROR_CODE.UNKNOWN_ERROR
    );
  }
}
