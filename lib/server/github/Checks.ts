import { GithubCheckId } from "../../types";
import { getOctokit } from "./octokit";
import { CheckRun } from "./types";

export async function createCheck(
  projectOrganization: string,
  projectRepository: string,
  checkRun: {
    details_url: string;
    head_sha: string;
    output: {
      summary: string;
      title: string;
    };
    status: string;
  }
) {
  const octokit = await getOctokit();
  const response = await octokit.request(
    `POST /repos/${projectOrganization}/${projectRepository}/check-runs`,
    {
      ...checkRun,
      name: "Delta",
      owner: projectOrganization,
      repo: projectRepository,
      started_at: new Date().toISOString(),
    }
  );

  return response.data as CheckRun;
}

export type UpdateCheckData = {
  conclusion: CheckRun["conclusion"];
  output: {
    summary: string;
    title: string;
  };
  status: string;
};

export async function updateCheck(
  projectOrganization: string,
  projectRepository: string,
  checkRunId: GithubCheckId,
  checkRun: UpdateCheckData
) {
  const octokit = await getOctokit();
  const response = await octokit.request(
    `PATCH /repos/${projectOrganization}/${projectRepository}/check-runs/${checkRunId}`,
    {
      ...checkRun,
      check_run_id: checkRunId,
      completed_at: new Date().toISOString(),
      owner: projectOrganization,
      repo: projectRepository,
    }
  );

  return response.data as CheckRun;
}
