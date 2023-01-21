import {
  Branch,
  getBranchByNameResponse,
  getBranchesResponse,
} from "../lib/server/supabase/supabase";
import { fetchJSON } from "../utils/fetchJSON";
import { createGenericCache } from "./createGenericCache";

export const {
  getValueSuspense: fetchBranchesSuspense,
  getValueAsync: fetchBranchesAsync,
  getValueIfCached: fetchBranchesIfCached,
} = createGenericCache<[projectId: string], Branch[]>(
  (projectId: string) =>
    fetchJSON<getBranchesResponse>(`/api/getBranches?projectId=${projectId}`),
  (projectId: string) => projectId
);

export const {
  getValueSuspense: fetchBranchSuspense,
  getValueAsync: fetchBranchAsync,
  getValueIfCached: fetchBranchIfCached,
} = createGenericCache<[name: string], Branch>(
  (name: string) =>
    fetchJSON<getBranchByNameResponse>(`/api/getBranchByName?name=${name}`),
  (name: string) => name
);
