import { createCheck } from "../lib/github";
import githubFixtures from "../test/fixtures/github.json";

(async () => {
  // if (false) {
  //   const owner = "replayio";
  //   const repo = "devtools";
  //   const runId = "3743508842";
  //   const summary = "";
  //   const text = "";
  //   const headSha = "c412f1a4b953c940964e0913a3fefbcca6c25096";
  //   const checkRunId = 10261339745;

  //   if (false) {
  //     const title = "Tests are running";
  //     const status = "in_progress";
  //     const conclusion = "in_progress";
  //     const checkRes = await createCheck(owner, repo, {
  //       head_sha,
  //       title,
  //       summary,
  //       conclusion,
  //       status,
  //       text,
  //     });
  //     console.log(checkRes.data.id);
  //   } else {
  //     const title = "2 of 15 shapshots changed";
  //     const status = "completed";
  //     const conclusion = "failure";

  //     const updateRes = await updateCheck(owner, repo, checkRunId, {
  //       head_sha,
  //       title,
  //       conclusion,
  //       status,
  //       summary,
  //     });
  //     console.log(updateRes);
  //   }
  // } else {

  const { workflow_job, repository } = githubFixtures["workflow_job.queued"];
  if (!workflow_job) {
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
})();
