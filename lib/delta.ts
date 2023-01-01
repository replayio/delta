import { Project } from "./supabase";

export const getDeltaBranchUrl = (project: Project, branchName: string) =>
  `https://delta.replay.io/project/${project.short}/?branch=${branchName}`;
