import { createCache } from "suspense";
import { Action } from "../lib/server/supabase/supabase";
import { getActions, getMostRecentAction } from "../utils/ApiClient";

export const actionsCache = createCache<[branchId: string], Action[]>({
  debugLabel: "actions",
  async load([branchId]) {
    return getActions({ branchId });
  },
});

export const mostRecentActionForBranchCache = createCache<
  [branchId: string],
  Action
>({
  debugLabel: "mostRecentActionForBranch",
  async load([branchId]) {
    return getMostRecentAction({ branchId });
  },
});
