import createClient from "../../lib/initServerSupabase";
import { createCheck, updateCheck } from "../../lib/github";

const supabase = createClient();

export default async function handler(req, res) {
  const { payload } = req.body;
  const eventType = req.headers["x-github-event"];
  const project = await getProjectFromRepo(
    payload.repository.name,
    payload.organization.login
  );

  if (!project) {
    return skip(
      `no project found for ${payload.repository.name} and ${payload.organization.login}`
    );
  }

  const response = (status, data, error) => {
    console.log(
      `github-event ${eventType} status:${status} project:${project.id}`,
      json
    );
    res.status(status).json(status == 200 ? data : error);
  };

  const skip = (reason) => {
    console.log(`github-event ${eventType} skip project:${project.id}`, reason);
    res.status(500).json({ skip: reason });
  };

  console.log(`github-event ${eventType} start`, payload);

  switch (eventType) {
    case "pull_request": {
      if (payload.action === "opened") {
        return response(
          await supabase.from("Branches").upsert({
            name: payload.pull_request.head.ref,
            project_id: project.id,
            pr_url: payload.pull_request.url,
            pr_title: payload.pull_request.title,
            pr_number: payload.number,
            status: "open",
          })
        );
      } else if (payload.action === "closed") {
        return response(
          await supabase.from("Branches").update({
            name: payload.pull_request.head.ref,
            project_id: project.id,
            status: "closed",
          })
        );
      }
    }

    case "workflow_job": {
      if (payload.action === "queued") {
        if (
          !payload.workflow_job.workflow_name.startsWith("Playwright Snapshot")
        ) {
          return skip(`workflow is ${workflow_name}`);
        }

        const { branch } = await getBranchFromProject(
          project.id,
          payload.workflow_job.head_branch
        );

        if (!branch) {
          return skip(`branch ${payload.workflow_job.head_branch} not found`);
        }

        const check = await createCheck(
          payload.organization.login,
          payload.repository.name,
          {
            head_sha,
            title: "Tests are running",
            status: "in_progress",
            conclusion: "neutral",
            text: "",
            summary: "",
          }
        );

        const action = await supabase.from("Actions").insert({
          project_id: project.id,
          run_id: payload.workflow_job.run_id,
          branch_id: branch.id,
          head_sha: payload.workflow_job.head_sha,
          actor: payload.sender.login,
          branch,
          metadata,
        });

        return response({ status: 200, data: { check, action } });
      } else if (payload.action === "completed") {
        // TODO: check to see if the branch is different or not
        const isDifferent = false;

        return response(
          await updateCheck(
            payload.organization.login,
            payload.repository.name,
            {
              head_sha: payload.workflow_job.head_sha,
              title: "1 of 15 snapshots are different",
              summary: "",
              conclusion: isDifferent ? "failed" : "completed",
              status: "completed",
              text: "",
            }
          )
        );
      }
    }
  }

  console.log(`github-event ${eventType} skip`);
  return res.status(500).json({ skip: true });
}
