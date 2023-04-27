import type { NextApiRequest, NextApiResponse } from "next";

import { getAction } from "../../lib/server/supabase/actions";
import { getSnapshotsForAction } from "../../lib/server/supabase/snapshots";
import { Snapshot } from "../../lib/server/supabase/supabase";
import {
  GenericResponse,
  sendErrorResponseFromPostgrestError,
  sendErrorResponse,
  sendResponse,
  sendErrorMissingParametersResponse,
} from "./utils";

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
    return sendErrorMissingParametersResponse(response, {
      actionId,
      projectId,
    });
  }

  const { data: actionData, error: actionError } = await getAction(actionId);
  if (actionError) {
    return sendErrorResponseFromPostgrestError(response, actionError);
  } else if (actionData == null) {
    return sendErrorResponse(
      response,
      `No action found with id "${actionId}"`,
      404
    );
  }

  const { data: snapshotData, error: snapshotError } =
    await getSnapshotsForAction(actionData.id);
  if (snapshotError) {
    return sendErrorResponseFromPostgrestError(response, snapshotError);
  } else if (!snapshotData) {
    return sendErrorResponse(
      response,
      `No snapshots found for action id "${actionId}"`,
      404
    );
  }

  return sendResponse<ResponseData>(response, snapshotData);
}
