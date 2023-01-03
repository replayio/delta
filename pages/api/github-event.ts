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
  getBranchFromProject,
  updateBranch,
} from "../../lib/server/supabase/branches";
import {
  getActionFromRunId,
  updateAction,
} from "../../lib/server/supabase/actions";
import { getSnapshotsForAction } from "../../lib/server/supabase/snapshots";
import { getDeltaBranchUrl } from "../../lib/delta";

const supabase = createClient();

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
            payload.organization.login,
            payload.repository.name,
            {
              head_sha: payload.workflow_job.head_sha,
              details_url: getDeltaBranchUrl(project.data, branchName),
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
        const title = `${numDifferent} of ${snapshots.data.length} snapshots are different`;
        const updateCheckArgs = {
          head_sha: payload.workflow_job.head_sha,
          title,
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

        // only create a comment if there are differences
        if (numDifferent > 0) {
          // Create a comment if it doesn't already exist
          if (!branch.data.comment_id) {
            log("creating comment");
            const comment = await createComment(
              payload.organization.login,
              payload.repository.name,
              branch.data.pr_number
            );

            if (comment.status != 201) {
              return skip(`comment not created: ${JSON.stringify(comment)}`);
            }

            log("created comment. updating branch", comment.data.id);
            branch = await updateBranch(branch.data, {
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

          log(
            "updating comment",
            branch.data.comment_id,
            branch.data.pr_number
          );
          const updatedComment = await updateComment(
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

          if (updatedComment.status != 200) {
            return skip(
              `check ${branch.data.check_id} not updated: ${JSON.stringify(
                updatedComment
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
          },
        });
      }
    }
  }

  console.log(`github-event ${eventType} skip`);
  return res.status(500).json({ skip: true });
}
