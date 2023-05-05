import { App } from "@octokit/app";
import dotenv from "dotenv";

dotenv.config({ path: "./.env.local" });

export async function getOctokit() {
  const pem = process.env.PEM!;
  const appId = 274973;
  const organization = "replayio";
  const repository = "devtools";

  const app = new App({ appId, privateKey: pem });

  // First we need to get the installation id for the repo
  const { data: installation } = await app.octokit.request(
    `GET /repos/${organization}/${repository}/installation`
  );

  // Then we can get an octokit instance for the installation
  const octokit = await app.getInstallationOctokit(installation.id);

  return octokit;
}
