import { Project } from "./types";

export const getDeltaBranchUrl = (project: Project, branchName: string) =>
  `https://delta.replay.io/project/${project.short}/?branch=${branchName}`;
