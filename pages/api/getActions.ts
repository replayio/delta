import type { NextApiRequest, NextApiResponse } from "next";

import createClient from "../../lib/initServerSupabase";
import { retryOnError } from "../../lib/server/supabase/supabase";
import { Action, JobId } from "../../lib/types";
import {
  GenericResponse,
  sendErrorResponse,
  sendErrorResponseFromPostgrestError,
  sendResponse,
} from "./utils";

export type RequestParams = {
  jobId: JobId;
};
export type ResponseData = Action[];
export type Response = GenericResponse<ResponseData>;

const supabase = createClient();

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { jobId } = request.query as RequestParams;

  const { data, error } = await retryOnError(() =>
    supabase
      .from("Actions")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false })
      .limit(1000)
  );

  if (error) {
    return sendErrorResponseFromPostgrestError(response, error);
  } else if (!data) {
    return sendErrorResponse(
      response,
      `No actions found for branch id "${jobId}"`,
      404
    );
  } else {
    return sendResponse<ResponseData>(response, data);
  }
}
