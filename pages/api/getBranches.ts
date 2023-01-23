import type { NextApiRequest, NextApiResponse } from "next";

import createClient from "../../lib/initServerSupabase";
import { postgrestErrorToError } from "../../lib/server/supabase/errors";
import { Branch } from "../../lib/server/supabase/supabase";
import { ErrorResponse, GenericResponse, SuccessResponse } from "./types";

export type RequestParams = {
  projectId: string;
};
export type ResponseData = Branch[];
export type Response = GenericResponse<ResponseData>;

const supabase = createClient();

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  const { projectId } = request.query as RequestParams;

  const { data, error } = await supabase
    .from("Branches")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "open")
    .order("name", { ascending: true })
    .limit(1000);

  if (error) {
    return response.status(500).json({
      error: postgrestErrorToError(error),
    } as ErrorResponse);
  } else if (!data) {
    return response.status(404).json({
      error: new Error(`No branches found for project id "${projectId}"`),
    } as ErrorResponse);
  } else {
    return response.status(200).json({ data } as SuccessResponse<ResponseData>);
  }
}
