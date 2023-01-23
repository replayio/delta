import type { NextApiRequest, NextApiResponse } from "next";

import createClient from "../../lib/initServerSupabase";
import { postgrestErrorToError } from "../../lib/server/supabase/errors";
import { Action } from "../../lib/server/supabase/supabase";
import { ErrorResponse, GenericResponse, SuccessResponse } from "./types";

type ResponseData = Action[];

export type Response = GenericResponse<ResponseData>;

const supabase = createClient();

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { branchId } = request.query;

  const { data, error } = await supabase
    .from("Actions")
    .select("*")
    .eq("branch_id", branchId)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    return response.status(500).json({
      error: postgrestErrorToError(error),
    } as ErrorResponse);
  } else if (!data) {
    return response.status(404).json({
      error: new Error(`No actions found for branch id "${branchId}"`),
    } as ErrorResponse);
  } else {
    return response.status(200).json({
      data,
    } as SuccessResponse<ResponseData>);
  }
}
