import { describe, it, expect } from "vitest";

import {
  getSnapshotsFromBranch,
  getActionFromRunId,
  getSnapshotsForAction,
  updateActionStatus,
} from "../lib/server/supabase/supabase";

import {
  downloadSnapshot,
  listCorruptedSnapshots,
  removeCorruptedSnapshots,
} from "../lib/server/supabase/supabase-storage";

const projectId = "dcb5df26-b418-4fe2-9bdf-5a838e604ec4";

describe("supabase", () => {
  it("get snapshots", async () => {
    const sn = await getSnapshotsFromBranch(projectId, "main");
    expect(sn.data.length).toBeGreaterThan(0);
  });

  it("get action from run_id", async () => {
    const action = await getActionFromRunId(3796486541);
    expect(action.data.id).toEqual("1f11d17c-aa97-4c1f-b312-b1c1954c13f4");
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

  it.only("can update action status", async () => {
    const action = await updateActionStatus(
      "9ba81dd3-98c4-44a9-a013-5835a1931ae9",
      "failure"
    );

    expect(action.data.status).toEqual("failure");

    const action2 = await updateActionStatus(
      "9ba81dd3-98c4-44a9-a013-5835a1931ae9",
      "success"
    );

    expect(action2.data.status).toEqual("success");
  });
});
