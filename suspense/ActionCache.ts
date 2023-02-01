import { createGenericCache } from "./createGenericCache";
import { getActions, getMostRecentAction } from "../utils/ApiClient";
import { Action } from "../lib/server/supabase/supabase";

export const {
  getValueSuspense: fetchActionsSuspense,
  getValueAsync: fetchActionsAsync,
  getValueIfCached: fetchActionsIfCached,
} = createGenericCache<[branchId: string], Action[]>(
  (branchId: string) => getActions({ branchId }),
  (branchId: string) => branchId
);

export const {
  getValueSuspense: fetchMostRecentActionForBranchSuspense,
  getValueAsync: fetchMostRecentActionForBranchAsync,
  getValueIfCached: fetchMostRecentActionForBranchIfCached,
} = createGenericCache<[branchId: string], Action>(
  (branchId: string) => getMostRecentAction({ branchId }),
  (branchId: string) => branchId
);
