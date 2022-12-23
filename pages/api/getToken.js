const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const fetch = require("node-fetch");

dotenv.config({ path: "./.env.local" });

export default async function handler(_, res) {
  try {
    const pem = process.env.PEM;
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

    res.status(200).json(tokenRes);
  } catch (e) {
    console.error("error", e);
    res.status(500).json({ error: e });
  }
}
