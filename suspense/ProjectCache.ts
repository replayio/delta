import { createCache, createSingleEntryCache } from "suspense";
import {
  Project,
  ProjectId,
  ProjectSlug,
  isProjectId,
  isProjectSlug,
} from "../lib/types";
import { getProject, getPublicProjects } from "../utils/ApiClient";

export const projectCache = createCache<
  [projectIdOrSlug: ProjectId | ProjectSlug],
  Project
>({
  debugLabel: "project",
  async load([projectIdOrSlug]) {
    if (isProjectId(projectIdOrSlug)) {
      return getProject({ projectId: projectIdOrSlug });
    } else if (isProjectSlug(projectIdOrSlug)) {
      return getProject({ projectSlug: projectIdOrSlug });
    } else {
      throw Error(
        "Either projectId or projectSlug required but got:",
        projectIdOrSlug
      );
    }
  },
});

export const projectsCache = createSingleEntryCache<[], Project[]>({
  debugLabel: "projects",
  async load([]) {
    return getPublicProjects({});
  },
});
