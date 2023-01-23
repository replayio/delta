import { Project } from "../lib/server/supabase/supabase";
import { createGenericCacheForApiEndpoint } from "./createGenericCache";

export const {
  getValueSuspense: fetchProjectSuspense,
  getValueAsync: fetchProjectAsync,
  getValueIfCached: fetchProjectIfCached,
} = createGenericCacheForApiEndpoint<
  [projectId: string | null, projectShort: string | null],
  Project
>(
  (projectId: string | null, projectShort: string | null) => {
    if (projectId) {
      return `/api/getProject?projectId=${projectId}`;
    } else if (projectShort) {
      return `/api/getProject?projectShort=${projectShort}`;
    } else {
      throw Error("No projectId or projectShort provided");
    }
  },
  (projectId: string | null, projectShort: string | null) =>
    `${projectId}/${projectShort}`
);

export const {
  getValueSuspense: fetchProjectsSuspense,
  getValueAsync: fetchProjectsAsync,
  getValueIfCached: fetchProjectsIfCached,
} = createGenericCacheForApiEndpoint<[], Project[]>(
  () => `/api/getPublicProjects`,
  () => "projects"
);
