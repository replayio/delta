import { config } from "dotenv";

import { fetchURI } from "../utils/fetchURI";
import fixtures from "../test/fixtures/github.json";

config({ path: "./.env.local" });

async function testEvent(eventType, req) {
  return await fetchURI(process.env.HOST + "/api/github-event", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "GitHub-Hookshot/2179efe",
      "X-GitHub-Event": eventType,
      "X-GitHub-Delivery": "f0799a30-8227-11ed-86fa-53c4b61f18df",
      "X-GitHub-Hook-ID": "393511247",
      "X-GitHub-Hook-Installation-Target-ID": "274973",
      "X-GitHub-Hook-Installation-Target-Type": "integration",
    },
    body: JSON.stringify(req),
  });
}

(async () => {
  const action = "workflow_job.completed";
  const payload = fixtures[action];
  if (!payload) {
    console.error("No fixture found for action", action);
    return;
  }
  const eventType = action.split(".")[0];
  const response = await testEvent(eventType, payload);
  console.log(response);
})();
