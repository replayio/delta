const fetch = require("node-fetch");
const { Octokit } = require("@octokit/rest");
const { createAppAuth, createOAuthUserAuth } = require("@octokit/auth-app");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

dotenv.config({ path: "./.env.local" });

let token = "ghs_kZ1CuFPClgpn292epL0JFfJXyadMSZ4CZcoH";

// const token = jwt.sign(
//   {
//     iat: Date.now() - 60,
//     // # JWT expiration time (10 minute maximum)
//     exp: Date.now() + 10 * 60,
//     // # GitHub App's identifier
//     iss: 222164,
//   },
//   process.env.PEM,
//   { algorithm: "RS256" }
// );

const octokit = new Octokit({
  auth: token,
});

async function createCheck(owner, repo) {
  return octokit.request(`POST /repos/${owner}/${repo}/check-runs`, {
    owner: owner,
    repo: repo,
    name: "Visuals",
    head_sha: "c412f1a4b953c940964e0913a3fefbcca6c25096",
    status: "in_progress",
    conclusion: "failure",
    details_url: "https://replay-visuals.vercel.app/?branch=visuals5",
    started_at: new Date().toISOString(),
    output: {
      title: "3 of 15 snapshots changed",
      summary: "yo yo",
      //   text: "yo yo",
    },
  });
}

async function updateCheck(owner, repo, checkRunId) {
  return octokit.request(
    `PATCH /repos/${owner}/${repo}/check-runs/${checkRunId}`,
    {
      owner,
      repo,
      check_run_id: checkRunId,
      name: "Visuals",
      head_sha: "c412f1a4b953c940964e0913a3fefbcca6c25096",
      status: "completed",
      conclusion: "success",
      completed_at: new Date().toISOString(),
      output: {
        title: "5 of 15 snapshots changed",
        summary: "...",
        text: "...",
      },
    }
  );
}

(async () => {
  const owner = "replayio";
  const repo = "devtools";
  const runId = "3743508842";
  const conclusion = "failed";
  const title = "Visual changes";
  const summary = "3 of 15 snapshots changed";
  const checkRunId = 10239571970;

  const updateRes = await updateCheck(owner, repo, checkRunId);
  console.log(updateRes);
})();
