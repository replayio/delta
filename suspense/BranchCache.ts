import { createCache } from "suspense";
import { Branch, BranchId, ProjectId } from "../lib/types";
import { getBranches } from "../utils/ApiClient";

export const branchCache = createCache<
  [projectId: ProjectId, id: BranchId],
  Branch
>({
  debugLabel: "branch",
  async load([projectId, id]) {
    const branch = branchesCache
      .read(projectId)
      .find((branch) => branch.id === id);
    if (branch) {
      return branch;
    }

    throw Error(`Could not find branch with id "${id}"`);
  },
});

export const branchesCache = createCache<[projectId: ProjectId], Branch[]>({
  debugLabel: "branches",
  async load([projectId]) {
    return getBranches({ projectId });
  },
});
