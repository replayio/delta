import { BranchId, Project } from "./types";

export function getDeltaBranchUrl(project: Project, branchId: BranchId) {
  return `https://delta.replay.io/project/${project.slug}/?branchId=${branchId}`;
}
