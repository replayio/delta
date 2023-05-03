import { createCache } from "suspense";
import { Branch, BranchId, ProjectId } from "../lib/types";
import { getBranch, getBranches } from "../utils/ApiClient";

export const branchCache = createCache<[id: BranchId], Branch>({
  debugLabel: "branch",
  async load([id]) {
    return getBranch({ id });
  },
});

export const branchesCache = createCache<[projectId: ProjectId], Branch[]>({
  debugLabel: "branches",
  async load([projectId]) {
    return getBranches({ projectId });
  },
});
