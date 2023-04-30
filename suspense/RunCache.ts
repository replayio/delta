import { createCache } from "suspense";
import { BranchId, Run } from "../lib/types";
import { getJobs } from "../utils/ApiClient";

export const runsCache = createCache<[branchId: BranchId], Run[]>({
  debugLabel: "runs",
  async load([branchId]) {
    return getJobs({ branchId });
  },
});

export const mostRecentRunCache = createCache<[branchId: BranchId], Run>({
  debugLabel: "mostRecentRun",
  async load([branchId]) {
    const runs = await getJobs({ branchId, limit: "1" });
    return runs[0];
  },
});
