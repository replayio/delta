import { Action } from "../lib/server/supabase/supabase";
import { createGenericCacheForApiEndpoint } from "./createGenericCache";

export const {
  getValueSuspense: fetchActionsSuspense,
  getValueAsync: fetchActionsAsync,
  getValueIfCached: fetchActionsIfCached,
} = createGenericCacheForApiEndpoint<[branchId: string], Action[]>(
  (branchId: string) => `/api/getActions?branchId=${branchId}`,
  (branchId: string) => branchId
);
