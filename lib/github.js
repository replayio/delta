const fetch = require("node-fetch");
const { Octokit } = require("@octokit/rest");
const dotenv = require("dotenv");

dotenv.config({ path: "./.env.local" });
const HOST = process.env.HOST;

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

async function createCheck(
  owner,
  repo,
  { head_sha, title, summary, conclusion, text, status }
) {
  const octokit = await getOctokit();

  return octokit.request(`POST /repos/${owner}/${repo}/check-runs`, {
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
}

async function updateCheck(
  owner,
  repo,
  { head_sha, status, conclusion, title, summary, text }
) {
  const octokit = await getOctokit();

  return octokit.request(
    `PATCH /repos/${owner}/${repo}/check-runs/${checkRunId}`,
    {
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
    }
  );
}

module.exports = {
  createCheck,
  updateCheck,
};
