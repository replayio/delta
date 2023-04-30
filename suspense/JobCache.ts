import { createCache } from "suspense";
import { BranchId, Job } from "../lib/types";
import { getJobs } from "../utils/ApiClient";

export const jobsCache = createCache<[branchId: BranchId], Job[]>({
  debugLabel: "jobs",
  async load([branchId]) {
    return getJobs({ branchId });
  },
});

export const mostRecentJobCache = createCache<[branchId: BranchId], Job>({
  debugLabel: "mostRecentJob",
  async load([branchId]) {
    const jobs = await getJobs({ branchId, limit: "1" });
    return jobs[0];
  },
});
