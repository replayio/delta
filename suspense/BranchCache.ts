import { createCache } from "suspense";
import { Branch } from "../lib/server/supabase/supabase";
import { getBranchByName, getBranches } from "../utils/ApiClient";

export const branchCache = createCache<[branchName: string], Branch>({
  debugLabel: "branch",
  async load([branchName]) {
    return getBranchByName({ name: branchName });
  },
});

export const branchesCache = createCache<[projectId: string], Branch[]>({
  debugLabel: "branches",
  async load([projectId]) {
    return getBranches({ projectId });
  },
});
