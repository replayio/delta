import { createCache, createSingleEntryCache } from "suspense";
import { Project, ProjectId, ProjectSlug } from "../lib/types";
import { getProject, getPublicProjects } from "../utils/ApiClient";

export const projectCache = createCache<
  [projectId: ProjectId | null, projectSlug: ProjectSlug | null],
  Project
>({
  debugLabel: "project",
  getKey([projectId, projectSlug]) {
    return `${projectId}/${projectSlug}`;
  },
  async load([projectId, projectSlug]) {
    return getProject({ projectId, projectSlug });
  },
});

export const projectsCache = createSingleEntryCache<[], Project[]>({
  debugLabel: "projects",
  async load([]) {
    return getPublicProjects({});
  },
});
