import type { NextApiRequest, NextApiResponse } from "next";

import createClient from "../../lib/initServerSupabase";
import { retryOnError } from "../../lib/server/supabase/supabase";
import { Branch, ProjectId } from "../../lib/types";
import {
  GenericResponse,
  sendErrorMissingParametersResponse,
  sendErrorResponse,
  sendErrorResponseFromPostgrestError,
  sendResponse,
} from "./utils";

export type RequestParams = {
  projectId: ProjectId;
};
export type ResponseData = Branch[];
export type Response = GenericResponse<ResponseData>;

const supabase = createClient();

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { projectId } = request.query as RequestParams;
  if (!projectId) {
    return sendErrorMissingParametersResponse(response, { projectId });
  }

  const { data, error } = await retryOnError(() =>
    supabase
      .from("Branches")
      .select("*")
      .eq("project_id", projectId)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(1000)
  );

  if (error) {
    return sendErrorResponseFromPostgrestError(response, error);
  } else if (!data) {
    return sendErrorResponse(
      response,
      `No branches found for project id "${projectId}"`
    );
  } else {
    return sendResponse<ResponseData>(response, data);
  }
}
