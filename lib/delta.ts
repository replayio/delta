import { Project } from "./supabase";

export const getDeltaBranchUrl = (project: Project, branchName: string) =>
  `https://replay-visuals.vercel.app/project/${project.short}/?branch=${branchName}`;
