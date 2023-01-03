import { describe, it, expect } from "vitest";
import {
  getBranchFromProject,
  getBranchesFromProject,
} from "../lib/server/supabase/branches";
import {
  getActionFromBranch,
  updateAction,
} from "../lib/server/supabase/actions";
import { getSnapshotsForAction } from "../lib/server/supabase/snapshots";
const projectId = "dcb5df26-b418-4fe2-9bdf-5a838e604ec4";

describe("actions", () => {
  it("can get the latest action for a branch", async () => {
    const branch = await getBranchFromProject(projectId, "visuals10");
    expect(branch.data.id).toEqual("ca7f4ea9-c13a-46c3-96c5-2cb972c514ef");

    const action = await getActionFromBranch(branch.data.id);
    expect(action.data.id).toEqual("7014f712-991d-417f-91e6-ca2aca818b59");
  });

  it.skip("can update the snapshot count for open branches", async () => {
    const branches = await getBranchesFromProject(projectId);
    const openBranches = branches.data.filter((b) => b.status == "open");

    const actions = await Promise.all(
      openBranches.map((b) => getActionFromBranch(b.id))
    );

    for (const action of actions) {
      const snapshots = await getSnapshotsForAction(action.data.id);
      const snapshotCount = snapshots.data.length;
      const snapshotChangedCount = snapshots.data.filter(
        (snapshot) => snapshot.primary_changed
      ).length;

      console.log(
        `Action ${action.data.id} has ${snapshotCount} snapshots and ${snapshotChangedCount} changed snapshots`
      );
      await updateAction(action.data.id, {
        num_snapshots: snapshotCount,
        num_snapshots_changed: snapshotChangedCount,
      });
    }
  });
});
