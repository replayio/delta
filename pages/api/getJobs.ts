import type { NextApiRequest, NextApiResponse } from "next";

import createClient from "../../lib/initServerSupabase";
import { retryOnError } from "../../lib/server/supabase/supabase";
import { BranchId, Job } from "../../lib/types";
import {
  GenericResponse,
  sendErrorResponse,
  sendErrorResponseFromPostgrestError,
  sendResponse,
} from "./utils";

export type RequestParams = {
  branchId: BranchId;
  limit?: string;
};
export type ResponseData = Job[];
export type Response = GenericResponse<ResponseData>;

const supabase = createClient();

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { branchId, limit = "1000" } = request.query as RequestParams;

  const { data, error } = await retryOnError(() =>
    supabase
      .from("Jobs")
      .select("*")
      .eq("branch_id", branchId)
      .order("created_at", { ascending: false })
      .limit(parseInt(limit, 10))
  );

  if (error) {
    return sendErrorResponseFromPostgrestError(response, error);
  } else if (!data) {
    return sendErrorResponse(
      response,
      `No jobs found for branch id "${branchId}"`,
      404
    );
  } else {
    return sendResponse<ResponseData>(response, data);
  }
}
