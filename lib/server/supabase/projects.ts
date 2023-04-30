import {
  PostgrestResponse,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";
import { Project, ProjectId } from "../../types";
import { retryOnError, supabase } from "./supabase";

export async function getProject(
  projectId: ProjectId
): Promise<PostgrestSingleResponse<Project>> {
  return retryOnError(() =>
    supabase
      .from("Projects")
      .select("*")
      .eq("id", projectId)
      .order("created_at", { ascending: false })
      .single()
  );
}

export async function getProjectForShort(
  projectShort: string
): Promise<PostgrestSingleResponse<Project>> {
  return retryOnError(() =>
    supabase.from("Projects").select("*").eq("short", projectShort).single()
  );
}

export async function getPublicProjects(): Promise<PostgrestResponse<Project>> {
  return retryOnError(() =>
    supabase
      .from("Projects")
      .select("*")
      .eq("public", true)
      .order("created_at", { ascending: false })
  );
}

export function getProjectForOrganizationAndRepository(
  organization: string,
  repository: string
): Promise<PostgrestSingleResponse<Project>> {
  return retryOnError(() =>
    supabase
      .from("Projects")
      .select("*")
      .eq("organization", organization)
      .eq("repository", repository)
      .single()
  );
}
