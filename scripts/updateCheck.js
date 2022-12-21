const fetch = require("node-fetch");
const { Octokit } = require("@octokit/rest");
const { createAppAuth, createOAuthUserAuth } = require("@octokit/auth-app");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

dotenv.config({ path: "./.env.local" });

const token = jwt.sign(
  {
    iat: Date.now() - 60,
    // # JWT expiration time (10 minute maximum)
    exp: Date.now() + 10 * 60,
    // # GitHub App's identifier
    iss: 222164,
  },
  process.env.PEM,
  { algorithm: "RS256" }
);

const octokit = new Octokit({
  auth: token,
  //   authStrategy: createAppAuth,
  //   auth: {
  //     appId: 222164,
  //     privateKey: process.env.PEM,
  //     installationId: 1,
  //   },
});
// console.log(process.env.PEM)
// 0()

// const octokit = new Octokit({
//   auth: process.env.GITHUB_PERSONAL_TOKEN,
// });

async function octo2UpdateCheck({ owner, repo, runId }, conclusion) {
  const update = {
    status: "completed",
    conclusion,
    completed_at: new Date(),
  };

  return octokit.checks.update({
    owner,
    repo,
    check_run_id: runId,
    ...update,
  });
}

async function octoUpdateCheck(
  { owner, repo, runId },
  conclusion,
  { title, summary }
) {
  await octokit.request(`PATCH /repos/${owner}/${repo}/check-runs/${runId}`, {
    owner: owner,
    repo: repo,
    check_run_id: runId,
    conclusion,
    output: {
      title,
      summary,
    },
  });
}

async function updateCheck({ owner, repo, runId }, conclusion, title, summary) {
  let res;

  try {
    res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/check-runs/${runId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conclusion, output: { title, summary } }),
      }
    );

    // const json = await body.json();
    if (res.status !== 200) {
      const body = await res.text();
      console.log(res.status, body);
      return body;
    }
    const body = await res.json();
    return body;
  } catch (e) {
    console.error("error", e);
  }
}

(async () => {
  const owner = "replayio";
  const repo = "devtools";
  const runId = "3743508842";
  const conclusion = "failed";
  const title = "Visual changes";
  const summary = "3 of 15 snapshots changed";

  //   const res = await octoUpdateCheck({ owner, repo, runId }, conclusion, {
  //     title,
  //     summary,
  //   });

  const res = await octo2UpdateCheck({ owner, repo, runId }, conclusion);
  console.log(res);
})();
