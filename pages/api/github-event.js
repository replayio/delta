const fetch = require("node-fetch");
const dotenv = require("dotenv");

dotenv.config({ path: "./.env.local" });
const HOST = process.env.HOST;

async function post(path, body) {
  const res = await fetch(`${HOST}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.status === 200) {
    return res.json();
  }

  return { status: res.status, error: await res.text() };
}

// Perform some processing or logic based on the event type and payload
export default async function handler(req, res) {
  console.log("github-event (1)");
  const { payload } = req.body;
  const eventType = req.headers["x-github-event"];

  console.log("github-event (2)", eventType, Object.keys(payload));

  if (eventType == "workflow_job") {
    if (payload.action === "queued") {
      console.log("github-event (3) creating a check");
      const createRes = await post("/api/createCheck", payload);
      console.log("github-event (4) created a check", createRes);
      res.status(200).json(createRes);
      return;
    }
    if (payload.action === "completed") {
      console.log("github-event (3) updating a check");
      const updateRes = await post("/api/updateCheck", payload);
      console.log("github-event (3) updated a check", updateRes);
      res.status(200).json(updateRes);
      return;
    }
  }

  console.log("skip this event");
  res.status(400).json();
}
