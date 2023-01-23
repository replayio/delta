import type { NextApiRequest, NextApiResponse } from "next";

import { getAction } from "../../lib/server/supabase/actions";
import { postgrestErrorToError } from "../../lib/server/supabase/errors";
import { getSnapshotFromAction } from "../../lib/server/supabase/snapshots";
import { Snapshot } from "../../lib/server/supabase/supabase";
import { ErrorResponse, GenericResponse, SuccessResponse } from "./types";

export type RequestParams = {
  actionId: string;
  projectId: string;
};
export type ResponseData = Snapshot[];
export type Response = GenericResponse<ResponseData>;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { actionId, projectId } = request.query as RequestParams;
  if (!actionId || !projectId) {
    return response.status(422).json({
      error: new Error('Missing required param(s) "actionId" or "projectId"'),
    } as ErrorResponse);
  }

  const { data: actionData, error: actionError } = await getAction(actionId);
  if (actionError) {
    return response.status(500).json({
      error: postgrestErrorToError(actionError),
    } as ErrorResponse);
  } else if (actionData == null) {
    return response.status(404).json({
      error: new Error(`No action found with id "${actionId}"`),
    } as ErrorResponse);
  }

  const { data: snapshotData, error: snapshotError } =
    await getSnapshotFromAction(actionData);
  if (snapshotError) {
    return response.status(500).json({
      error: postgrestErrorToError(snapshotError),
    } as ErrorResponse);
  } else if (!snapshotData) {
    return response.status(404).json({
      error: new Error(`No snapshots found for action id "${actionId}"`),
    } as ErrorResponse);
  }

  return response
    .status(200)
    .json({ data: snapshotData } as SuccessResponse<ResponseData>);
}
