import { GithubCheckId } from "../../types";
import { getOctokit } from "./octokit";
import { CheckRun } from "./types";

type Output = {
  summary: string;
  text: string;
  title: string;
};

export async function createCheck(
  projectOrganization: string,
  projectRepository: string,
  checkRun: Partial<
    Pick<CheckRun, "conclusion" | "details_url" | "head_sha" | "status"> &
      Output
  >
) {
  const { head_sha, title, summary, text, status, details_url, conclusion } =
    checkRun;

  const octokit = await getOctokit();
  const response = await octokit.request(
    `POST /repos/${projectOrganization}/${projectRepository}/check-runs`,
    {
      conclusion,
      details_url,
      head_sha,
      name: "Delta",
      organization: projectOrganization,
      output: {
        title,
        summary,
        text,
      },
      repo: projectRepository,
      started_at: new Date().toISOString(),
      status,
    }
  );

  return response.data as CheckRun;
}

export async function updateCheck(
  projectOrganization: string,
  projectRepository: string,
  checkRunId: GithubCheckId,
  checkRun: Partial<
    Pick<CheckRun, "conclusion" | "head_sha" | "status"> & Output
  >
) {
  const { head_sha, title, summary, text, status, conclusion } = checkRun;

  const octokit = await getOctokit();
  const response = await octokit.request(
    `PATCH /repos/${projectOrganization}/${projectRepository}/check-runs/${checkRunId}`,
    {
      check_run_id: checkRunId,
      completed_at: new Date().toISOString(),
      conclusion,
      head_sha,
      name: "Delta",
      organization: projectOrganization,
      output: {
        title,
        summary,
        text,
      },
      repo: projectRepository,
      status,
    }
  );

  return response.data as CheckRun;
}
