// Perform some processing or logic based on the event type and payload
export default async function handler(req, res) {
  console.log("event-received (1)");
  const { payload } = req.body;

  const eventType = req.headers["x-github-event"];

  console.log("event-received (2)", eventType);

  if (
    eventType == "workflow_job" &&
    req.body.workflow_job?.workflow_name == "Tests: Playwright"
  ) {
    console.log("lets have fun", eventType, payload);
    const { run_id, head_sha } = req.body.workflow_job;
    res.status(200).json({ run_id, head_sha });
    return;
  }

  console.log("skip this event");
  res.status(400).json();
}
