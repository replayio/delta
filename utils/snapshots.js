export function changedSnapshots(snapshots) {
  return snapshots?.filter((snapshot) => snapshot.primary_changed);
}
