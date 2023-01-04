import { describe, it, expect } from "vitest";
import { getBranchFromProject } from "../lib/server/supabase/branches";
import { getSnapshotsForAction } from "../lib/server/supabase/snapshots";
import { getProject } from "../lib/server/supabase/supabase";
import { getActionFromBranch } from "../lib/server/supabase/actions";
import { formatComment } from "../pages/api/github-event";

const dotenv = require("dotenv");
const fetch = require("node-fetch");
const fixtures = require("./fixtures/github");
dotenv.config({ path: "./.env.local" });
const projectId = "dcb5df26-b418-4fe2-9bdf-5a838e604ec4";

async function testEvent(action) {
  const payload = fixtures[action];
  if (!payload) {
    console.error("No fixture found for action", action);
    return;
  }
  const eventType = action.split(".")[0];

  let res;

  try {
    res = await fetch(process.env.HOST + "/api/github-event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "GitHub-Hookshot/2179efe",
        "X-GitHub-Event": eventType,
        "X-GitHub-Delivery": "f0799a30-8227-11ed-86fa-53c4b61f18df",
        "X-GitHub-Hook-ID": "393511247",
        "X-GitHub-Hook-Installation-Target-ID": "274973",
        "X-GitHub-Hook-Installation-Target-Type": "integration",
      },
      body: JSON.stringify(payload),
    });

    if (res.status > 299) {
      return res.text();
    }

    return res.json();
  } catch (e) {
    console.error("error", e);
  }
}

describe("github event", () => {
  it("workflow completed", async () => {
    const res = await testEvent("workflow_job.completed");
    expect(res.check.output.title).toEqual(
      "376 of 789 snapshots are different"
    );
  });

  it("format comments", async () => {
    const project = await getProject(projectId);
    const branchName = "visuals21";
    const branch = await getBranchFromProject(project.data.id, branchName);
    const action = await getActionFromBranch(branch.data.id);

    const snapshots = await getSnapshotsForAction(action.data.id);
    const comment = formatComment({
      project: project.data,
      branchName,
      snapshots: snapshots.data,
    });

    expect(comment).toMatchSnapshot();
  });

  it("format comment w/ subtitle", async () => {
    const project = await getProject(projectId);
    const branchName = "visuals21";
    const branch = await getBranchFromProject(project.data.id, branchName);
    const action = await getActionFromBranch(branch.data.id);

    const snapshots = await getSnapshotsForAction(action.data.id);
    const comment = formatComment({
      project: project.data,
      branchName,
      snapshots: snapshots.data,
      subTitle: "**(Approved)**",
    });
    console.log(comment);

    expect(comment).toMatchSnapshot();
  });
});
