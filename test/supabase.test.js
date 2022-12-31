import {
  getSnapshotsFromBranch,
  getActionFromRunId,
  getSnapshotsForAction,
} from "../lib/supabase";

const projectId = "dcb5df26-b418-4fe2-9bdf-5a838e604ec4";

test("get snapshots", async () => {
  const sn = await getSnapshotsFromBranch(projectId, "main");
  expect(sn.data.length).toBeGreaterThan(0);
});

test("get action from run_id", async () => {
  const action = await getActionFromRunId(3796486541);
  expect(action.data.id).toEqual("1f11d17c-aa97-4c1f-b312-b1c1954c13f4");
});

test("get snapshots for action", async () => {
  const snapshots = await getSnapshotsForAction(
    "7be05e81-8595-4052-a969-3cfaddb44188"
  );
  expect(snapshots.data).toHaveLength(360);
});
