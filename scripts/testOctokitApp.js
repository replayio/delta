const { App } = require("@octokit/app");
const dotenv = require("dotenv");

dotenv.config({ path: "./.env.local" });

(async () => {
  const appId = 274973;
  const owner = "replayio";
  const repo = "devtools";

  const app = new App({ appId, privateKey: process.env.PEM });

  // First we need to get the installation id for the repo
  const { data: installation } = await app.octokit.request(
    `GET /repos/${owner}/${repo}/installation`
  );

  // Then we can get an octokit instance for the installation
  const octokit = await app.getInstallationOctokit(installation.id);

  // Then we go nuts
  const { data: issues } = await octokit.request(
    `GET /repos/${owner}/${repo}/issues`
  );

  console.log(issues);
})();
