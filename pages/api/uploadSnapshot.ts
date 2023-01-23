import type { NextApiRequest, NextApiResponse } from "next";

import {
  getSnapshotFromBranch,
  insertSnapshot,
  updateSnapshot,
} from "../../lib/server/supabase/snapshots";
import { uploadSnapshot } from "../../lib/server/supabase/storage";
import { diffWithPrimaryBranch } from "../../lib/server/diffWithPrimaryBranch";
import { incrementActionNumSnapshotsChanged } from "../../lib/server/supabase/incrementActionNumSnapshotsChanged";
import {
  isPostgrestError,
  postgrestErrorToError,
} from "../../lib/server/supabase/errors";
import { Snapshot } from "../../lib/server/supabase/supabase";
import { ErrorResponse, GenericResponse, SuccessResponse } from "./types";

type ResponseData = Snapshot;

export type Response = GenericResponse<ResponseData>;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { branch: branchName, image, projectId, runId } = request.body;
  if (!branchName || !image || !projectId || !runId) {
    return response.status(422).json({
      error: new Error(
        'Missing required param(s) "branch", "image", "projectId", or "runId"'
      ),
    } as ErrorResponse);
  }

  try {
    const uploadResult = await uploadSnapshot(image.content, projectId);
    if (uploadResult.error) {
      return response.status(500).json({
        error: Error(uploadResult.error),
      } as ErrorResponse);
    }

    const insertedSnapshot = await insertSnapshot(
      branchName,
      projectId,
      image,
      runId
    );
    if (insertedSnapshot.error) {
      return response.status(500).json({
        error:
          typeof insertedSnapshot.error === "string"
            ? Error(insertedSnapshot.error)
            : postgrestErrorToError(insertedSnapshot.error),
      } as ErrorResponse);
    }

    let snapshot: Snapshot | null = insertedSnapshot.data;
    if (!snapshot) {
      const previousSnapshot = await getSnapshotFromBranch(
        image.file,
        projectId,
        branchName
      );
      if (previousSnapshot.error) {
        return response.status(500).json({
          error: isPostgrestError(previousSnapshot.error)
            ? postgrestErrorToError(previousSnapshot.error)
            : Error(previousSnapshot.error.message),
        } as ErrorResponse);
      }

      snapshot = previousSnapshot.data ?? null;
    }

    if (snapshot === null) {
      return response
        .status(500)
        .json({ error: Error("Could not find snapshot") });
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
      return response.status(500).json({
        error: postgrestErrorToError(updatedSnapshot.error),
      } as ErrorResponse);
    }

    if (primaryDiff.changed) {
      await incrementActionNumSnapshotsChanged(projectId, branchName);
    }

    response
      .status(200)
      .json({ data: updatedSnapshot.data } as SuccessResponse<ResponseData>);
  } catch (error) {
    response.status(500).json({ error } as ErrorResponse);
  }
}
