import type { NextApiRequest, NextApiResponse } from "next";

import {
  getSnapshotFromBranch,
  insertSnapshot,
  updateSnapshot,
} from "../../lib/server/supabase/snapshots";
import { uploadSnapshot } from "../../lib/server/supabase/storage";
import { diffWithPrimaryBranch } from "../../lib/server/diffWithPrimaryBranch";
import { incrementActionNumSnapshotsChanged } from "../../lib/server/supabase/incrementActionNumSnapshotsChanged";
import { isPostgrestError } from "../../lib/server/supabase/errors";
import { Snapshot } from "../../lib/server/supabase/supabase";
import {
  GenericResponse,
  sendErrorResponseFromPostgrestError,
  sendErrorResponse,
  sendResponse,
  sendErrorMissingParametersResponse,
} from "./utils";

export type Image = {
  content: string;
  file: string;
};

export type RequestParams = {
  branchName: string;
  image: Image;
  projectId: string;
  runId: string;
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
    const uploadResult = await uploadSnapshot(image.content, projectId);

    // Duplicates will fail to upload, but that's okay.
    const uploadStatus = uploadResult.error || "Uploaded";

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
      const previousSnapshot = await getSnapshotFromBranch(
        image.file,
        projectId,
        branchName
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

    const primaryDiff = await diffWithPrimaryBranch(
      projectId,
      branchName,
      image
    );

    const updatedSnapshot = await updateSnapshot(snapshot.id, {
      primary_changed: primaryDiff.changed,
      primary_diff_path: primaryDiff.diffSnapshot?.path,
      primary_num_pixels: primaryDiff.numPixels,
    });
    if (updatedSnapshot.error) {
      return sendErrorResponseFromPostgrestError(
        response,
        updatedSnapshot.error
      );
    }

    if (primaryDiff.changed) {
      await incrementActionNumSnapshotsChanged(projectId, branchName);
    }

    return sendResponse<ResponseData>(response, updatedSnapshot.data);
  } catch (error) {
    return sendErrorResponse(
      response,
      typeof error === "string" ? error : error.message ?? "Error"
    );
  }
}
