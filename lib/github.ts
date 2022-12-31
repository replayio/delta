import { App } from "@octokit/app";
import dotenv from "dotenv";

dotenv.config({ path: "./.env.local" });

type CheckArgs = {
  head_sha?: string;
  status?: string;
  conclusion?: string;
  title?: string;
  summary?: string;
  text?: string;
};

async function getOctokit() {
  const pem = process.env.PEM;
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
  { head_sha, title, summary, conclusion, text, status }
) {
  const octokit = await getOctokit();

  const check = octokit.request(`POST /repos/${owner}/${repo}/check-runs`, {
    owner: owner,
    repo: repo,
    name: "Visuals",
    head_sha,
    status,
    conclusion,
    details_url: "https://replay-visuals.vercel.app/?branch=visuals5",
    started_at: new Date().toISOString(),
    output: {
      title,
      summary,
      text,
    },
  });

  return check;
}

export async function updateCheck(
  owner: string,
  repo: string,
  checkRunId: string,
  { head_sha, status, conclusion, title, summary, text }: CheckArgs
) {
  const octokit = await getOctokit();

  const checkArgs = {
    owner,
    repo,
    check_run_id: checkRunId,
    name: "Visuals",
    head_sha: head_sha,
    status,
    conclusion,
    completed_at: new Date().toISOString(),
    output: {
      title,
      summary,
      text,
    },
  };

  console.log("updateCheck", checkArgs);
  return octokit.request(
    `PATCH /repos/${owner}/${repo}/check-runs/${checkRunId}`,
    checkArgs
  );
}
