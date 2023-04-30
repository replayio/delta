import { createCache } from "suspense";
import { Action, JobId } from "../lib/types";
import { getActions } from "../utils/ApiClient";

export const actionsCache = createCache<[jobId: JobId], Action[]>({
  debugLabel: "actions",
  async load([jobId]) {
    return getActions({ jobId });
  },
});
