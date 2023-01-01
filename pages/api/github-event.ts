import createClient from "../../lib/initServerSupabase";
import { createCheck, updateCheck } from "../../lib/github";
import omit from "lodash/omit";

import {
  getProjectFromRepo,
  getBranchFromProject,
  updateBranch,
  getActionFromRunId,
  getSnapshotsForAction,
  updateActionStatus,
} from "../../lib/supabase";

const supabase = createClient();

const formatCheck = (check) => omit(check, ["app", "pull_requests"]);

export default async function handler(req, res) {
  const payload = req.body;
  const eventType = req.headers["x-github-event"];
  let i = 1;

  const project = await getProjectFromRepo(
    payload.repository.name,
    payload.organization.login
  );

  const skip = (reason) => {
    console.log(
      `github-event ${eventType}.${payload.action} skip project:${payload.repository.name}`,
      reason
    );
    res.status(500).json({ skip: reason });
  };

  const response = ({ data, status, error = null }) => {
    console.log(
      `github-event ${eventType}.${payload.action} status:${status} project:${project.data.id}`,
      data
    );
    res.status(status).json([200, 201].includes(status) ? data : error);
  };

  const log = (...args) => {
    console.log(
      `github-event ${eventType}.${payload.action} (${i++})`,
      ...args
    );
  };

  log(`start`);

  if (project.error) {
    return skip(
      `no project found for ${payload.repository.name} and ${payload.organization.login}`
    );
  }

  switch (eventType) {
    case "pull_request": {
      if (payload.action === "opened") {
        return response(
          await supabase
            .from("Branches")
            .upsert({
              name: payload.pull_request.head.ref,
              project_id: project.data.id,
              pr_url: payload.pull_request.url,
              pr_title: payload.pull_request.title,
              pr_number: payload.number,
              status: "open",
            })
            .single()
        );
      } else if (payload.action === "closed") {
        const branch = await getBranchFromProject(
          project.data.id,
          payload.pull_request.head.ref
        );

        if (branch.error) {
          return skip(
            `branch ${
              payload.pull_request.head.ref
            } not found: ${JSON.stringify(branch.error)}`
          );
        }

        return response(
          await supabase
            .from("Branches")
            .update({
              name: payload.pull_request.head.ref,
              project_id: project.data.id,
              status: "closed",
            })
            .eq("id", branch.data.id)
            .single()
        );
      }
    }

    case "workflow_job": {
      if (payload.action === "queued") {
        log(payload.workflow_job.workflow_name);
        if (
          !payload.workflow_job.workflow_name.startsWith("Playwright Snapshot")
        ) {
          return skip(`workflow is ${payload.workflow_job.workflow_name}`);
        }

        const branchName = payload.workflow_job.head_branch;
        const projectId = project.data.id;
        log("getting branch", projectId, branchName);

        const branch = await getBranchFromProject(projectId, branchName);

        if (branch.error) {
          return skip(`branch ${branchName} not found`);
        }

        let checkId = branch.data.check_id;
        let newCheck;
        if (!checkId) {
          log(
            "creating check",
            payload.organization.login,
            payload.repository.name,
            {
              head_sha: payload.workflow_job.head_sha,
              title: "Tests are running",
              status: "in_progress",
              conclusion: "neutral",
              text: "",
              summary: "",
            }
          );
          const check = await createCheck(
            project.data.short,
            branchName,
            payload.organization.login,
            payload.repository.name,
            {
              head_sha: payload.workflow_job.head_sha,
              title: "Tests are running",
              status: "in_progress",
              conclusion: "neutral",
              text: "",
              summary: "",
            }
          );
          log(
            "created check",
            check.data.id,
            check.status <= 299 ? check.data : check
          );
          checkId = check.data.id;
          newCheck = check.data;

          const updatedBranch = await updateBranch(branch.data, {
            check_id: checkId,
          });

          log(
            "updated branch",
            updatedBranch.status,
            updatedBranch.status <= 299 ? "success" : "error",
            updatedBranch.status <= 299
              ? updatedBranch.data
              : updatedBranch.error
          );
        }

        const insertActionArgs = {
          run_id: payload.workflow_job.run_id,
          branch_id: branch.data.id,
          head_sha: payload.workflow_job.head_sha,
          actor: payload.sender.login,
          status: "neutral",
        };

        log("insert action", insertActionArgs);

        const action = await supabase
          .from("Actions")
          .insert(insertActionArgs)
          .single();

        return response({
          status: 200,
          data: {
            checkId,
            check: formatCheck(newCheck),
            action: action.status == 201 ? action.data : action.error,
          },
        });
      } else if (payload.action === "completed") {
        log(payload.workflow_job.workflow_name);
        if (
          !payload.workflow_job.workflow_name.startsWith("Playwright Snapshot")
        ) {
          return skip(`workflow is ${payload.workflow_job.workflow_name}`);
        }

        const branchName = payload.workflow_job.head_branch;
        log("getting branch", project.data.id, branchName);
        const branch = await getBranchFromProject(project.data.id, branchName);

        if (branch.error) {
          return skip(
            `branch ${
              payload.workflow_job.head_branch
            } not found: ${JSON.stringify(branch.error)}`
          );
        }

        if (!branch.data.check_id) {
          return skip(`Branch ${branch.data.name} is missing a check_id`);
        }

        log("found branch", branch.data.id, branch.data.check_id);
        const runId = payload.workflow_job.run_id;
        const action = await getActionFromRunId(runId);
        if (action.error) {
          return skip(
            `action for run ${runId} not found: ${JSON.stringify(action.error)}`
          );
        }

        log("found action", action.data.id);
        const snapshots = await getSnapshotsForAction(action.data.id);
        if (snapshots.error) {
          return skip(
            `snapshots for action ${action.data.id} not found: ${JSON.stringify(
              snapshots.error
            )}`
          );
        }

        const numDifferent = snapshots.data.filter(
          (s) => s.primary_changed
        ).length;

        const conclusion = numDifferent > 0 ? "failure" : "success";
        const updateCheckArgs = {
          head_sha: payload.workflow_job.head_sha,
          title: `${numDifferent} of ${snapshots.data.length} snapshots are different`,
          summary: "",
          conclusion,
          status: "completed",
          text: "",
        };

        log("updating check", branch.data.check_id, updateCheckArgs);
        const updatedCheck = await updateCheck(
          payload.organization.login,
          payload.repository.name,
          branch.data.check_id,
          updateCheckArgs
        );

        if (updatedCheck.status != 200) {
          return skip(
            `check ${branch.data.check_id} not updated: ${JSON.stringify(
              updatedCheck
            )}`
          );
        }

        log("updating action status", action.data.id, conclusion);
        const updatedAction = await updateActionStatus(
          action.data.id,
          conclusion
        );

        if (updatedAction.error) {
          return skip(
            `action ${action.data.id} not updated: ${JSON.stringify(
              updatedAction.error
            )}`
          );
        }

        return response({
          status: 200,
          data: {
            check: formatCheck(updatedCheck.data),
            action: updatedAction.data,
          },
        });
      }
    }
  }

  console.log(`github-event ${eventType} skip`);
  return res.status(500).json({ skip: true });
}
