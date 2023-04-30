import { describe, it, expect } from "vitest";
import {
  getActionsFromRunId,
  updateAction,
  incrementActionNumSnapshots,
  getAction,
  getActionFromBranch,
} from "../lib/server/supabase/actions";
import omit from "lodash/omit";
import { incrementActionNumSnapshotsChanged } from "../lib/server/supabase/incrementActionNumSnapshotsChanged";
import {
  getSnapshotsForBranch,
  getSnapshotsForAction,
  getSnapshotForBranch,
} from "../lib/server/supabase/snapshots";

import { getBranchForProject } from "../lib/server/supabase/branches";

import { downloadSnapshot } from "../lib/server/supabase/storage";
import { ProjectId } from "../lib/server/supabase/supabase";

const projectId = "dcb5df26-b418-4fe2-9bdf-5a838e604ec4" as ProjectId;

describe("supabase", () => {
  it("get snapshots", async () => {
    const sn = await getSnapshotsForBranch(projectId, "main");
    expect(sn.data.length).toBeGreaterThan(0);
  });

  it("get snapshot - warning-stack-collapsed.png", async () => {
    const file = "./playwright/visuals/light/warning-stack-collapsed.png";
    const branchName = "mbudayr/BAC-2510/use-focus-window-to-load-regions";

    const branch = await getBranchForProject(projectId, branchName);
    const snapshot = await getSnapshotForBranch(projectId, branchName, file);

    expect(omit(snapshot.data, ["created_at", "id"])).toMatchSnapshot();
    expect(branch.data).toMatchSnapshot();
  });

  it("get action from run_id", async () => {
    const actions = await getActionsFromRunId("3796486541");
    expect(actions.data?.[0].id).toEqual(
      "1f11d17c-aa97-4c1f-b312-b1c1954c13f4"
    );
  });

  it("get snapshots for action", async () => {
    const snapshots = await getSnapshotsForAction(
      "7be05e81-8595-4052-a969-3cfaddb44188"
    );
    expect(snapshots.data).toHaveLength(360);
  });

  it("download snapshot", async () => {
    const snapshot = await downloadSnapshot(
      "dcb5df26-b418-4fe2-9bdf-5a838e604ec4/ff8f1f8d9217d9c96e70995292445d33edbd54f411d96b9bdf46733c349da318.png"
    );
    expect(snapshot.data.slice(0, 10)).toEqual("iVBORw0KGg");
  });

  it("can update action status", async () => {
    const actionId = "9ba81dd3-98c4-44a9-a013-5835a1931ae9";
    const action = await updateAction(actionId, { status: "failure" });

    expect(action.data.status).toEqual("failure");

    const action2 = await updateAction(actionId, { status: "success" });

    expect(action2.data.status).toEqual("success");
  });

  it("increments num_snapshots", async () => {
    const actionId = "bb0205c1-0055-40e0-bcad-717ccce77685";
    const action = await getAction(actionId);

    const { num_snapshots } = action.data;
    const { data } = await incrementActionNumSnapshots(actionId);

    const newNumSnapshots = data[0].num_snapshots;
    expect(newNumSnapshots).toEqual(num_snapshots + 1);
  });

  it("increments num_snapshots_changed", async () => {
    const branch = await getBranchForProject(projectId, "visuals10");
    const action = await getActionFromBranch(branch.data.id);

    const { num_snapshots_changed } = action.data;
    const { data } = await incrementActionNumSnapshotsChanged(
      projectId,
      "visuals10"
    );

    const newNumSnapshots = data[0].num_snapshots_changed;
    expect(newNumSnapshots).toEqual(num_snapshots_changed + 1);
  });
});
