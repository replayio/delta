import { Branch } from "../lib/server/supabase/supabase";
import { getBranchByName, getBranches } from "../utils/ApiClient";
import { createGenericCache } from "./createGenericCache";

export const {
  getValueSuspense: fetchBranchesSuspense,
  getValueAsync: fetchBranchesAsync,
  getValueIfCached: fetchBranchesIfCached,
} = createGenericCache<[projectId: string], Branch[]>(
  (projectId: string) => getBranches({ projectId }),
  (projectId: string) => projectId
);

export const {
  getValueSuspense: fetchBranchSuspense,
  getValueAsync: fetchBranchAsync,
  getValueIfCached: fetchBranchIfCached,
} = createGenericCache<[branchName: string], Branch>(
  (branchName: string) => getBranchByName({ name: branchName }),
  (branchName: string) => branchName
);
