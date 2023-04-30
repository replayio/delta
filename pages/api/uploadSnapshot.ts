import type { NextApiRequest, NextApiResponse } from "next";

import { diffWithPrimaryBranch } from "../../lib/server/diffWithPrimaryBranch";
import { isPostgrestError } from "../../lib/server/supabase/errors";
import {
  getJobForBranch,
  incrementNumSnapshotsChanged,
} from "../../lib/server/supabase/jobs";
import {
  getSnapshotForBranch,
  insertSnapshot,
  updateSnapshot,
} from "../../lib/server/supabase/snapshots";
import { uploadSnapshot } from "../../lib/server/supabase/storage";
import { ProjectId, RunId, Snapshot, SnapshotStatus } from "../../lib/types";
import {
  GenericResponse,
  sendErrorMissingParametersResponse,
  sendErrorResponse,
  sendErrorResponseFromPostgrestError,
  sendResponse,
} from "./utils";
import { getBranchByName } from "../../lib/server/supabase/branches";

export type Image = {
  content: string;
  file: string;
};

export type RequestParams = {
  branchName: string;
  image: Image;
  projectId: ProjectId;
  runId: RunId;
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
      return typeof insertedSnapshot.error === "string"
        ? sendErrorResponse(response, insertedSnapshot.error)
        : sendErrorResponseFromPostgrestError(response, insertedSnapshot.error);
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
        return isPostgrestError(previousSnapshot.error)
          ? sendErrorResponseFromPostgrestError(
              response,
              previousSnapshot.error
            )
          : sendErrorResponse(response, previousSnapshot.error.message);
      }

      snapshot = previousSnapshot.data ?? null;
    }

    if (snapshot === null) {
      return sendErrorResponse(response, "Could not find snapshot");
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
      });
      if (updatedSnapshot.error) {
        return sendErrorResponseFromPostgrestError(
          response,
          updatedSnapshot.error
        );
      }

      const branch = await getBranchByName(branchName);
      if (branch.error) {
        return branch.error;
      }

      const job = await getJobForBranch(branch.data.id, runId);
      if (job.error) {
        return job.error;
      }

      await incrementNumSnapshotsChanged(job.data.id);

      return sendResponse<ResponseData>(response, updatedSnapshot.data);
    }

    return sendResponse<ResponseData>(response, snapshot);
  } catch (error) {
    console.error("uploadSnapshot caught error:", error);
    return sendErrorResponse(
      response,
      typeof error === "string" ? error : error.message ?? "Error"
    );
  }
}
