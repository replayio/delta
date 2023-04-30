import { createCache, createSingleEntryCache } from "suspense";
import { Project, ProjectId, ProjectShort } from "../lib/types";
import { getProject, getPublicProjects } from "../utils/ApiClient";

export const projectCache = createCache<
  [projectId: ProjectId | null, projectShort: ProjectShort | null],
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
