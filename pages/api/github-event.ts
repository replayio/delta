import createClient from "../../lib/initServerSupabase";
import { createCheck, updateCheck } from "../../lib/github";

import {
  getProjectFromRepo,
  getBranchFromProject,
  updateBranch,
} from "../../lib/supabase";

const supabase = createClient();

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
        return response(
          await supabase.from("Branches").update({
            name: payload.pull_request.head.ref,
            project_id: project.data.id,
            status: "closed",
          })
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

        log(
          "getting branch",
          project.data.id,
          payload.workflow_job.head_branch
        );

        const branch = await getBranchFromProject(
          project.data.id,
          payload.workflow_job.head_branch
        );

        if (branch.error) {
          return skip(`branch ${payload.workflow_job.head_branch} not found`);
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
            checkId,
            check.status == 201 ? check.data : check
          );
          checkId = check.data.id;
          newCheck = check.data;

          const updatedBranch = await updateBranch(branch.data, {
            check_id: checkId,
          });

          log(
            "updated branch",
            updatedBranch.status == 201 ? "success" : "error",
            updatedBranch.status == 201
              ? updatedBranch.data
              : updatedBranch.error
          );
        }

        const insertActionArgs = {
          run_id: payload.workflow_job.run_id,
          branch_id: branch.data.id,
          head_sha: payload.workflow_job.head_sha,
          actor: payload.sender.login,
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
            newCheck,
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

        const branch = await getBranchFromProject(
          project.data.id,
          payload.workflow_job.head_branch
        );

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

        // TODO: check to see if the branch is different or not
        const isDifferent = false;

        const updateCheckArgs = {
          head_sha: payload.workflow_job.head_sha,
          title: "1 of 15 snapshots are different",
          summary: "",
          conclusion: isDifferent ? "failure" : "success",
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

        return response({
          status: 200,
          data: {
            check:
              updatedCheck.status == 200 ? updatedCheck.data : updatedCheck,
          },
        });
      }
    }
  }

  console.log(`github-event ${eventType} skip`);
  return res.status(500).json({ skip: true });
}
