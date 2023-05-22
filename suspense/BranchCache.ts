import { createCache } from "suspense";
import { Branch, BranchId, ProjectId } from "../lib/types";
import { getBranch, getMostRecentBranches } from "../utils/ApiClient";

export const branchCache = createCache<[branchId: BranchId], Branch>({
  debugLabel: "branch",
  async load([branchId]) {
    return getBranch({ branchId });
  },
});

export const branchesCache = createCache<[projectId: ProjectId], Branch[]>({
  debugLabel: "branches",
  async load([projectId]) {
    return getMostRecentBranches({ projectId });
  },
});
