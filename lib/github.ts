import { App } from "@octokit/app";
import { components } from "@octokit/openapi-types";
import dotenv from "dotenv";

dotenv.config({ path: "./.env.local" });

export type IssueComment = components["schemas"]["issue-comment"];
export type CheckRun = components["schemas"]["check-run"];

type CheckArgs = {
  conclusion?: string;
  details_url?: string;
  head_sha?: string;
  status?: string;
  summary?: string;
  text?: string;
  title?: string;
};

async function getOctokit() {
  const pem = process.env.PEM!;
  const appId = 274973;
  const owner = "replayio";
  const repo = "devtools";

  const app = new App({ appId, privateKey: pem });

  // First we need to get the installation id for the repo
  const { data: installation } = await app.octokit.request(
    `GET /repos/${owner}/${repo}/installation`
  );

  // Then we can get an octokit instance for the installation
  const octokit = await app.getInstallationOctokit(installation.id);

  return octokit;
}

export async function createCheck(
  owner,
  repo,
  { head_sha, title, summary, text, status, details_url, conclusion }: CheckArgs
) {
  const octokit = await getOctokit();
  const response = await octokit.request(
    `POST /repos/${owner}/${repo}/check-runs`,
    {
      owner: owner,
      repo: repo,
      name: "Delta",
      head_sha,
      status,
      details_url,
      conclusion,
      started_at: new Date().toISOString(),
      output: {
        title,
        summary,
        text,
      },
    }
  );

  return response.data as CheckRun;
}

export async function updateCheck(
  owner: string,
  repo: string,
  checkRunId: string,
  { head_sha, status, conclusion, title, summary, text }: CheckArgs
) {
  const octokit = await getOctokit();
  const response = await octokit.request(
    `PATCH /repos/${owner}/${repo}/check-runs/${checkRunId}`,
    {
      owner,
      repo,
      check_run_id: checkRunId,
      name: "Delta",
      head_sha,
      status,
      conclusion,
      completed_at: new Date().toISOString(),
      output: {
        title,
        summary,
        text,
      },
    }
  );

  return response.data as CheckRun;
}

export async function createComment(
  owner,
  repo,
  issue_number,
  { body } = { body: "..." }
) {
  const octokit = await getOctokit();
  const response = await octokit.request(
    `POST /repos/${owner}/${repo}/issues/${issue_number}/comments`,
    {
      owner,
      repo,
      issue_number,
      body,
    }
  );

  return response.data as IssueComment;
}

export async function updateComment(owner, repo, comment_id, { body }) {
  const octokit = await getOctokit();
  const response = await octokit.request(
    `PATCH /repos/${owner}/${repo}/issues/comments/${comment_id}`,
    {
      owner,
      repo,
      comment_id,
      body,
    }
  );

  return response.data as IssueComment;
}
