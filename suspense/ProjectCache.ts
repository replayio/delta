import { Project } from "../lib/server/supabase/supabase";
import { getProject, getPublicProjects } from "../utils/ApiClient";
import { createGenericCache } from "./createGenericCache";

export const {
  getValueSuspense: fetchProjectSuspense,
  getValueAsync: fetchProjectAsync,
  getValueIfCached: fetchProjectIfCached,
} = createGenericCache<
  [projectId: string | null, projectShort: string | null],
  Project
>(
  (projectId: string | null, projectShort: string | null) =>
    getProject({ projectId, projectShort }),
  (projectId: string | null, projectShort: string | null) =>
    `${projectId}/${projectShort}`
);

export const {
  getValueSuspense: fetchProjectsSuspense,
  getValueAsync: fetchProjectsAsync,
  getValueIfCached: fetchProjectsIfCached,
} = createGenericCache<[], Project[]>(
  () => getPublicProjects({}),
  () => "projects"
);
