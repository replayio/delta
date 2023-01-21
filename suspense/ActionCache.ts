import { Action, getActionsResponse } from "../lib/server/supabase/supabase";
import { fetchJSON } from "../utils/fetchJSON";
import { createGenericCache } from "./createGenericCache";

export const {
  getValueSuspense: fetchActionsSuspense,
  getValueAsync: fetchActionsAsync,
  getValueIfCached: fetchActionsIfCached,
} = createGenericCache<[branchId: string], Action[]>(
  (branchId: string) =>
    fetchJSON<getActionsResponse>(`/api/getActions?branchId=${branchId}`),
  (branchId: string) => branchId
);
