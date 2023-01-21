import {
  getProjectResponse,
  getPublicProjectsResponse,
  Project,
} from "../lib/server/supabase/supabase";
import { fetchJSON } from "../utils/fetchJSON";
import { createGenericCache } from "./createGenericCache";

export const {
  getValueSuspense: fetchProjectSuspense,
  getValueAsync: fetchProjectAsync,
  getValueIfCached: fetchProjectIfCached,
} = createGenericCache<
  [projectId: string | null, projectShort: string | null],
  Project
>(
  async (projectId: string | null, projectShort: string | null) => {
    let url;
    if (projectId) {
      url = `/api/getProject?projectId=${projectId}`;
    } else if (projectShort) {
      url = `/api/getProject?projectShort=${projectShort}`;
    } else {
      throw Error("No projectId or projectShort provided");
    }

    return await fetchJSON<getProjectResponse>(url);
  },
  (projectId: string | null, projectShort: string | null) =>
    `${projectId}/${projectShort}`
);

export const {
  getValueSuspense: fetchProjectsSuspense,
  getValueAsync: fetchProjectsAsync,
  getValueIfCached: fetchProjectsIfCached,
} = createGenericCache<[], Project[]>(
  () => fetchJSON<getPublicProjectsResponse>(`/api/getPublicProjects`),
  () => "projects"
);
