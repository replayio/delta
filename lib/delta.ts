import { Project } from "./types";

export function getDeltaBranchUrl(project: Project, branchName: string) {
  return `https://delta.replay.io/project/${project.slug}/?branch=${branchName}`;
}
