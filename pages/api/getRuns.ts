import type { NextApiRequest, NextApiResponse } from "next";

import createClient from "../../lib/initServerSupabase";
import { retryOnError } from "../../lib/server/supabase/supabase";
import { BranchId, Run } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./statusCodes";
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
export type ResponseData = Run[];
export type Response = GenericResponse<ResponseData>;

const supabase = createClient();

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { branchId, limit = "1000" } = request.query as RequestParams;

  const { data, error } = await retryOnError(() =>
    supabase
      .from("Runs")
      .select("*")
      .eq("branch_id", branchId)
      .order("created_at", { ascending: false })
      .limit(parseInt(limit, 10))
  );

  if (error) {
    return sendErrorResponseFromPostgrestError(
      response,
      error,
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
      `No Run found for Branch id "${branchId}"`
    );
  } else if (!data) {
    return sendErrorResponse(
      response,
      `No Run found for Branch id "${branchId}"`,
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED
    );
  } else {
    return sendResponse<ResponseData>(response, data);
  }
}
