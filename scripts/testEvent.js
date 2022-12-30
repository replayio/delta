const dotenv = require("dotenv");
const fetch = require("node-fetch");
const fixtures = require("../test/fixtures/github");
dotenv.config({ path: "./.env.local" });

async function testEvent(eventType, req) {
  let res;

  try {
    res = await fetch(process.env.HOST + "/api/github-event", {
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

    if (res.status > 299) {
      return res.text();
    }

    return res.json();
  } catch (e) {
    console.error("error", e);
  }
}

(async () => {
  const action = "pull_request.closed";
  const payload = fixtures[action];
  const eventType = action.split(".")[0];
  const res = await testEvent(eventType, payload);
  console.log(res);
})();
