import { WorkflowRun } from "@octokit/webhooks-types";
import dotenv from "dotenv";
import { getOctokit } from "./octokit";

dotenv.config({ path: "./.env.local" });

// https://docs.github.com/en/rest/actions/workflow-runs?apiVersion=2022-11-28#get-a-workflow-run
export async function getWorkflowRun(
  organization: string,
  repository: string,
  workflowRunId: number
) {
  const octokit = await getOctokit();
  const response = await octokit.request(
    `POST /repos/${organization}/${repository}/actions/runs/${workflowRunId}`,
    {
      organization,
      repo: repository,
      run_id: workflowRunId,
    }
  );

  return response.data as WorkflowRun;
}
