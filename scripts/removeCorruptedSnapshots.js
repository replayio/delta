const {
  listCorruptedSnapshots,
  removeCorruptedSnapshots,
} = require("../lib/supabase-storage");

(async () => {
  const projectId = "dcb5df26-b418-4fe2-9bdf-5a838e604ec4";
  await removeCorruptedSnapshots(projectId);
  const snapshots = await listCorruptedSnapshots(projectId);

  console.log(snapshots);
})();
