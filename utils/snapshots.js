export function getSnapshotStatus(snapshot) {
  return !snapshot.mainSnapshot
    ? "new"
    : snapshot.mainSnapshot.sha == snapshot.sha
    ? "same"
    : "different";
}
