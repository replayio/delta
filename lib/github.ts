import { App } from "@octokit/app";
import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";

dotenv.config({ path: "./.env.local" });

type CheckArgs = {
  conclusion?: string;
  details_url?: string;
  head_sha?: string;
  status?: string;
  summary?: string;
  text?: string;
  title?: string;
};

async function getOctokit(): Promise<Octokit> {
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
  return (await app.getInstallationOctokit(installation.id)) as Octokit;
}

export async function createCheck(
  owner,
  repo,
  { head_sha, title, summary, text, status, details_url, conclusion }: CheckArgs
) {
  const octokit = await getOctokit();

  return await octokit.checks.create({
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
  });
}

export async function updateCheck(
  owner: string,
  repo: string,
  checkRunId: string,
  { head_sha, status, conclusion, title, summary, text }: CheckArgs
) {
  const octokit = await getOctokit();

  return await octokit.checks.update({
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
  });
}

export async function createComment(
  owner,
  repo,
  issue_number,
  { body } = { body: "..." }
) {
  const octokit = await getOctokit();

  return await octokit.issues.createComment({
    body,
    issue_number,
    owner,
    repo,
  });
}

export async function updateComment(owner, repo, comment_id, { body }) {
  const octokit = await getOctokit();

  return await octokit.issues.updateComment({
    body,
    comment_id,
    owner,
    repo,
  });
}
