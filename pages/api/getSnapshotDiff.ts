import type { NextApiRequest, NextApiResponse } from "next";

import { getSnapshotFromBranch } from "../../lib/server/supabase/snapshots";
import { downloadSnapshot } from "../../lib/server/supabase/storage";
import { diffWithPrimaryBranch } from "../../lib/server/diffWithPrimaryBranch";
import { updateSnapshot } from "../../lib/server/supabase/snapshots";
import { ErrorResponse, GenericResponse, SuccessResponse } from "./types";
import {
  isPostgrestError,
  postgrestErrorToError,
} from "../../lib/server/supabase/errors";

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
    return response.status(422).json({
      error: new Error(
        'Missing required param(s) "branchName", "projectId", or "snapshotFile"'
      ),
    } as ErrorResponse);
  }

  const { data: snapshotData, error: snapshotError } =
    await getSnapshotFromBranch(snapshotFile, projectId, branchName);
  if (snapshotError) {
    return response.status(500).json({
      error: isPostgrestError(snapshotError)
        ? postgrestErrorToError(snapshotError)
        : new Error(snapshotError.message),
    } as ErrorResponse);
  } else if (!snapshotData) {
    return response.status(500).json({
      error: Error("Could not download snapshot data"),
    } as ErrorResponse);
  }

  if (snapshotData.primary_diff_path) {
    const { data, error } = await downloadSnapshot(
      snapshotData.primary_diff_path
    );
    if (error) {
      return response.status(500).json({
        error,
      } as ErrorResponse);
    } else if (!data) {
      return response.status(500).json({
        error: Error("Could not download snapshot primary diff"),
      } as ErrorResponse);
    }

    response.setHeader("Content-Type", "image/png");
    return response.status(200).send({ data } as SuccessResponse<ResponseData>);
  }

  const imageRes = await downloadSnapshot(snapshotData.path);
  const diff = await diffWithPrimaryBranch(projectId, branchName, {
    file: snapshotFile,
    content: imageRes.data || "",
  });
  if (diff.error || !diff.png) {
    return response.status(500).json({
      error: Error(diff.error || "Could not create diff"),
    } as ErrorResponse);
  }

  // Save the primary_diff_path to the snapshot if it exists
  if (diff.diffSnapshot?.path) {
    const updatedSnapshot = await updateSnapshot(snapshotData.id, {
      primary_diff_path: diff.diffSnapshot.path,
      primary_num_pixels: diff.numPixels,
      primary_changed: diff.changed,
    });
    if (updatedSnapshot.error) {
      return response.status(500).json({
        error: Error("Failed to update snapshot diff"),
      } as ErrorResponse);
    }
  }

  response.setHeader("Content-Type", "image/png");
  return response.status(200).send({
    data: diff.png.toString(),
  } as SuccessResponse<ResponseData>);
}
