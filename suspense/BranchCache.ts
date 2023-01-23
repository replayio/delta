import { Branch } from "../lib/server/supabase/supabase";
import { createGenericCacheForApiEndpoint } from "./createGenericCache";

export const {
  getValueSuspense: fetchBranchesSuspense,
  getValueAsync: fetchBranchesAsync,
  getValueIfCached: fetchBranchesIfCached,
} = createGenericCacheForApiEndpoint<[projectId: string], Branch[]>(
  (projectId: string) => `/api/getBranches?projectId=${projectId}`,
  (projectId: string) => projectId
);

export const {
  getValueSuspense: fetchBranchSuspense,
  getValueAsync: fetchBranchAsync,
  getValueIfCached: fetchBranchIfCached,
} = createGenericCacheForApiEndpoint<[name: string], Branch>(
  (name: string) => `/api/getBranchByName?name=${name}`,
  (name: string) => name
);
