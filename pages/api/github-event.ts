import createClient from "../../lib/initServerSupabase";
import {
  createCheck,
  updateCheck,
  createComment,
  updateComment,
} from "../../lib/github";
import omit from "lodash/omit";

import {
  getProjectFromRepo,
  Project,
  Snapshot,
} from "../../lib/server/supabase/supabase";
import {
  HTTPMetadata,
  insertHTTPEvent,
  insertHTTPMetadata,
  updateHTTPMetadata,
} from "../../lib/server/supabase/httpEvent";
import {
  getBranchFromProject,
  insertBranch,
  updateBranch,
  getBranch,
} from "../../lib/server/supabase/branches";
import {
  getActionFromRunId,
  updateAction,
} from "../../lib/server/supabase/actions";
import { getSnapshotsForAction } from "../../lib/server/supabase/snapshots";
import { getDeltaBranchUrl } from "../../lib/delta";
import { setupHook, getHTTPRequests } from "../../lib/server/http-replay";

const supabase = createClient();
setupHook();

const formatCheck = (check) => omit(check, ["app", "pull_requests"]);

export function formatComment({
  project,
  branchName,
  snapshots,
  subTitle = "",
}: {
  project: Project;
  branchName: string;
  snapshots: Snapshot[];
  subTitle?: string;
}) {
  const deltaUrl = getDeltaBranchUrl(project, branchName);

  const numDifferent = snapshots.filter(
    (snapshot) => snapshot.primary_changed
  ).length;

  const snapshotList = snapshots
    .filter((snapshot) => snapshot.primary_changed)
    .slice(0, 10)
    .map(
      (snapshot) =>
        `<details>
          <summary>${
            snapshot.file.split("/")[snapshot.file.split("/").length - 1]
          }</summary>
          <img src="https://delta.replay.io/api/snapshot?path=${
            snapshot.path
          }" />
        </details>`
    )
    .join("\n");

  const title =
    numDifferent > 0
      ? `${numDifferent} of ${snapshots.length} changed`
      : "Nothing changed";
  return [
    `**<a href="${deltaUrl}">${title}</a>** ${subTitle}`,
    snapshotList,
  ].join("\n");
}

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

  const response = async ({ data, status, error = null }) => {
    console.log(
      `github-event ${eventType}.${payload.action} status:${status} project:${project.data.id}`,
      data,
      error
    );

    if (httpMetadata && httpMetadata.id) {
      await insertHTTPEvent(httpMetadata.id, project.data.id, {
        request: {
          body: req.body,
        },
        requests: getHTTPRequests(),
        response: {
          data,
          error,
          status,
        },
      });
    }
    res.status(status).json([200, 201].includes(status) ? data : error);
  };

  const log = (...args) => {
    console.log(
      `github-event ${eventType}.${payload.action} (${i++})`,
      ...args
    );
  };

  let httpMetadata: HTTPMetadata | void;
  const insertMetadata = async (
    fields: Partial<HTTPMetadata> = {}
  ): Promise<HTTPMetadata | void> => {
    const metadata = await insertHTTPMetadata({
      action: payload.action,
      event_type: eventType,
      payload: payload,
      ...fields,
    });

    httpMetadata = metadata.data;
    return metadata.data;
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
        await insertMetadata({
          pr_number: payload.number,
          branch_name: payload.pull_request.head.ref,
        });
        const newBranch = {
          name: payload.pull_request.head.ref,
          project_id: project.data.id,
          pr_title: payload.pull_request.title,
          pr_number: payload.number,
          status: "open",
        };
        log("creating branch", newBranch);

        return response(await insertBranch(newBranch));
      } else if (payload.action === "closed") {
        await insertMetadata({
          pr_number: payload.number,
          branch_name: payload.pull_request.head.ref,
        });
        const branch = await getBranch(project.data.id, payload.number);

        if (branch.error) {
          return skip(
            `branch ${payload.pull_request.head.ref} ${
              payload.number
            } not found: ${JSON.stringify(branch.error)}`
          );
        }

        return response(
          await updateBranch(branch.data.id, { status: "closed" })
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

        const httpEvent = await insertMetadata({
          job_id: payload.workflow_job.id,
          run_id: payload.workflow_job.run_id,
          branch_name: payload.workflow_job.head_branch,
          head_sha: payload.workflow_job.head_sha,
        });

        const branchName = payload.workflow_job.head_branch;
        const projectId = project.data.id;
        log("getting branch", projectId, branchName);

        let branch = await getBranchFromProject(projectId, branchName);

        if (branch.error) {
          return skip(`branch ${branchName} not found`);
        }

        branch = await updateBranch(branch.data.id, {
          head_sha: payload.workflow_job.head_sha,
        });

        let checkId, newCheck;
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
            details_url: getDeltaBranchUrl(project.data, branchName),
            title: "Tests are running",
            status: "in_progress",
            text: "",
            summary: "",
          }
        );

        await updateHTTPMetadata(httpMetadata, { check });

        if (check.status <= 299) {
          checkId = check.data.id;
          newCheck = check.data;

          const updatedBranch = await updateBranch(branch.data.id, {
            check_id: checkId,
          });

          log(
            "updated branch ",
            updatedBranch.status,
            checkId,
            updatedBranch.data.checkId
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

        await insertMetadata({
          job_id: payload.workflow_job.id,
          run_id: payload.workflow_job.run_id,
          branch_name: payload.workflow_job.head_branch,
          head_sha: payload.workflow_job.head_sha,
        });

        const branchName = payload.workflow_job.head_branch;
        log("getting branch", project.data.id, branchName);
        let branch = await getBranchFromProject(project.data.id, branchName);

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

        log("found branch with check", branch.data.id, branch.data.check_id);
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
        const title = `${numDifferent} of ${snapshots.data.length} snapshots are different`;
        const updateCheckArgs = {
          head_sha: payload.workflow_job.head_sha,
          title,
          summary: "",
          conclusion,
          status: "completed",
          text: "",
        };

        let updatedCheck;
        if (branch.data.check_id) {
          log("updating check", branch.data.check_id, updateCheckArgs);
          updatedCheck = await updateCheck(
            payload.organization.login,
            payload.repository.name,
            branch.data.check_id,
            updateCheckArgs
          );
        } else {
          log("Check doesnt exist");
        }

        // Create a comment if it doesn't already exist
        // and there are differences
        let comment;
        if (numDifferent > 0 && !branch.data.comment_id) {
          log("creating comment");
          comment = await createComment(
            payload.organization.login,
            payload.repository.name,
            branch.data.pr_number
          );

          if (comment.status != 201) {
            return skip(`comment not created: ${JSON.stringify(comment)}`);
          }

          log("created comment. updating branch", comment.data.id);
          branch = await updateBranch(branch.data.id, {
            comment_id: comment.data.id,
          });

          if (branch.status != 200) {
            return skip(
              `branch ${branch.data.id} not updated: ${JSON.stringify(
                branch.error
              )}`
            );
          }
        }

        if (!branch.data.comment_id) {
          log("skipping updating a comment");
        } else {
          log(
            "updating comment",
            branch.data.comment_id,
            branch.data.pr_number
          );
          comment = await updateComment(
            payload.organization.login,
            payload.repository.name,
            branch.data.comment_id,
            {
              body: formatComment({
                branchName,
                project: project.data,
                snapshots: snapshots.data,
              }),
            }
          );

          if (comment.status != 200) {
            return skip(
              `check ${branch.data.check_id} not updated: ${JSON.stringify(
                comment
              )}`
            );
          }
        }

        log("updating action status", action.data.id, conclusion);
        const updatedAction = await updateAction(action.data.id, {
          status: conclusion,
        });

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
            comment: comment?.data,
          },
        });
      }
    }
  }

  console.log(`github-event ${eventType} skip`);
  return res.status(500).json({ skip: true });
}
