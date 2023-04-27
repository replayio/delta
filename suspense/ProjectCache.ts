import { createCache, createSingleEntryCache } from "suspense";
import { Project } from "../lib/server/supabase/supabase";
import { getProject, getPublicProjects } from "../utils/ApiClient";

export const projectCache = createCache<
  [projectId: string | null, projectShort: string | null],
  Project
>({
  debugLabel: "project",
  getKey([projectId, projectShort]) {
    return `${projectId}/${projectShort}`;
  },
  async load([projectId, projectShort]) {
    return getProject({ projectId, projectShort });
  },
});

export const projectsCache = createSingleEntryCache<[], Project[]>({
  debugLabel: "projects",
  async load([]) {
    return getPublicProjects({});
  },
});
