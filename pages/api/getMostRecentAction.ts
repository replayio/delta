import type { NextApiRequest, NextApiResponse } from "next";

import createClient from "../../lib/initServerSupabase";
import { Action, retryOnError } from "../../lib/server/supabase/supabase";
import {
  GenericResponse,
  sendErrorResponseFromPostgrestError,
  sendErrorResponse,
  sendResponse,
} from "./utils";

export type RequestParams = {
  branchId: string;
};
export type ResponseData = Action;
export type Response = GenericResponse<ResponseData>;

const supabase = createClient();

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { branchId } = request.query as RequestParams;

  const { data, error } = await retryOnError(() =>
    supabase
      .from("Actions")
      .select("*")
      .eq("branch_id", branchId)
      .order("created_at", { ascending: false })
      .limit(1)
  );

  if (error) {
    return sendErrorResponseFromPostgrestError(response, error);
  } else if (!data || data.length === 0) {
    return sendErrorResponse(
      response,
      `No actions found for branch id "${branchId}"`,
      404
    );
  } else {
    return sendResponse<ResponseData>(response, data[0]);
  }
}
