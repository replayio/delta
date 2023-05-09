import { App } from "@octokit/app";
import { createAppAuth } from "@octokit/auth-app";
import { throttling } from "@octokit/plugin-throttling";
import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";

dotenv.config({ path: "./.env.local" });

const privateKey = process.env.PEM!;
const appId = 274973;
const organization = "replayio";
const repository = "devtools";

export async function getOctokit() {
  const installationId = await getInstallationId();

  const ThrottledOctokit = Octokit.plugin(throttling);
  const octokit = new ThrottledOctokit({
    auth: {
      appId,
      privateKey,
      installationId,
    },
    authStrategy: createAppAuth,
    throttle: {
      onRateLimit: (retryAfter, options, octokit, retryCount) => {
        octokit.log.warn(
          `Request quota exhausted for request ${options.method} ${options.url}`
        );

        if (retryCount < 2) {
          octokit.log.info(`Retrying after ${retryAfter} seconds!`);
          return true;
        }
      },
      onSecondaryRateLimit: (retryAfter, options, octokit) => {
        octokit.log.warn(
          `SecondaryRateLimit detected for request ${options.method} ${options.url}`
        );
      },
    },
  });

  return octokit;
}

async function getInstallationId() {
  const app = new App({ appId, privateKey });

  // First we need to get the installation id for the repo
  const { data: installation } = await app.octokit.request(
    `GET /repos/${organization}/${repository}/installation`
  );

  return installation.id;
}
