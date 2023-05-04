import { createCache } from "suspense";
import { PullRequest, PullRequestId, RunId } from "../lib/types";
import { getPullRequestForId, getPullRequestForRun } from "../utils/ApiClient";

export const pullRequestCache = createCache<[id: PullRequestId], PullRequest>({
  debugLabel: "pullRequest",
  async load([id]) {
    return getPullRequestForId({ id });
  },
});

export const pullRequestForRunCache = createCache<[runId: RunId], PullRequest>({
  debugLabel: "pullRequestForRun",
  async load([runId]) {
    return getPullRequestForRun({ runId });
  },
});
