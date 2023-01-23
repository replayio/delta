import { createGenericCache } from "./createGenericCache";
import { getActions } from "../utils/ApiClient";
import { Action } from "../lib/server/supabase/supabase";

export const {
  getValueSuspense: fetchActionsSuspense,
  getValueAsync: fetchActionsAsync,
  getValueIfCached: fetchActionsIfCached,
} = createGenericCache<[branchId: string], Action[]>(
  (branchId: string) => getActions({ branchId }),
  (branchId: string) => branchId
);
