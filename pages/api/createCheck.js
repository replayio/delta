const { createCheck } = require("../../lib/github");

export default async function handler(req, res) {
  try {
    const { workflow_job, repository } = req.body;
    if (!workflow_job) {
      console.log(`Bailing because there is no workflow`);
      return;
    }

    const { workflow_name, status: workflowStatus, head_sha } = workflow_job;
    const {
      name: repo,
      owner: { login: owner },
    } = repository;

    if (!workflow_name.startsWith("Tests: Playwright")) {
      console.log(`Bailing because the workflow name is ${workflow_name}`);
      return;
    }

    if (workflowStatus !== "queued") {
      console.log(`Bailing because the workflow status is ${workflowStatus}`);
      return;
    }

    const createRes = await createCheck(owner, repo, {
      head_sha,
      title: "Tests are running",
      status: "in_progress",
      conclusion: "neutral",
      text: "",
      summary: "",
    });

    console.log(createRes);
    res.status(200).json(createRes);
  } catch (e) {
    console.error(e);
    res.status(500).json(e);
  }
}
