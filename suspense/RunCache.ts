import { createCache } from "suspense";
import { BranchId, Run } from "../lib/types";
import { getRuns } from "../utils/ApiClient";

export const runsCache = createCache<[branchId: BranchId], Run[]>({
  debugLabel: "runs",
  async load([branchId]) {
    return getRuns({ branchId });
  },
});

export const mostRecentRunCache = createCache<[branchId: BranchId], Run>({
  debugLabel: "mostRecentRun",
  async load([branchId]) {
    const runs = await getRuns({ branchId, limit: "1" });
    return runs[0];
  },
});
