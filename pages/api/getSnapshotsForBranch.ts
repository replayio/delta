import type { NextApiRequest, NextApiResponse } from "next";

import { postgrestErrorToError } from "../../lib/server/supabase/errors";
import { getSnapshotsFromBranch } from "../../lib/server/supabase/snapshots";
import { Snapshot } from "../../lib/server/supabase/supabase";
import { ErrorResponse, GenericResponse, SuccessResponse } from "./types";

type ResponseData = Snapshot[];

export type Response = GenericResponse<ResponseData>;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { branch, project_id } = request.query;
  if (!branch || !project_id) {
    return response.status(422).json({
      error: new Error('Missing required param(s) "branch" or "project_id"'),
    } as ErrorResponse);
  }

  const { data, error } = await getSnapshotsFromBranch(
    project_id as string,
    branch as string
  );

  if (error) {
    return response.status(500).json({
      error:
        typeof error === "string"
          ? new Error(error)
          : postgrestErrorToError(error),
    } as ErrorResponse);
  } else if (!data) {
    return response.status(404).json({
      error: new Error(
        `No snapshots found for project "${project_id}" and branch "${branch}"`
      ),
    } as ErrorResponse);
  } else {
    return response.status(200).json({ data } as SuccessResponse<ResponseData>);
  }
}
