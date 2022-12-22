const fetch = require("node-fetch");
const { Octokit } = require("@octokit/rest");
const dotenv = require("dotenv");

dotenv.config({ path: "./.env.local" });
const HOST = process.env.HOST;

async function fetchToken() {
  let res;

  try {
    res = await fetch(`${HOST}/api/getToken`);

    if (res.status === 200) {
      const body = await res.json();
      return body;
    }

    const body = await res.text();
    console.log(res.status, body);
    return body;
  } catch (e) {
    console.error("error", e);
  }
}

async function createCheck(
  owner,
  repo,
  { head_sha, title, summary, conclusion, text, status }
) {
  const tokenRes = await fetchToken();
  const octokit = new Octokit({ auth: tokenRes.token });

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
  checkRunId,
  { head_sha, status, conclusion, title, summary, text }
) {
  const tokenRes = await fetchToken();
  const octokit = new Octokit({ auth: tokenRes.token });

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
