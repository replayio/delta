import useSWR from "swr";
import { useMemo } from "react";

import { fetchJSON } from "../utils/fetchJSON";

export function useFetchSnapshots(currentAction, projectQuery) {
  const selectedKey = encodeURI(
    currentAction && projectQuery.data
      ? `/api/getSnapshotsForAction?action=${currentAction.id}&project_id=${projectQuery.data.id}`
      : null
  );

  const { data, error, isLoading } = useSWR(selectedKey, fetchJSON);
  const primaryBranch = projectQuery.data?.primary_branch;
  const primaryKey =
    projectQuery.isLoading || projectQuery.error
      ? null
      : encodeURI(
          `/api/getSnapshotsForBranch?branch=${primaryBranch}&project_id=${projectQuery.data.id}`
        );

  const {
    data: mainData,
    error: mainError,
    isLoading: mainLoading,
  } = useSWR(primaryKey, fetchJSON);

  const snapshots = useMemo(() => {
    if (!data || !mainData) return [];
    if (data.error || mainData.error) return null;
    return data.map((snapshot) => {
      const mainSnapshot = mainData.find(
        (mainSnapshot) => mainSnapshot.file === snapshot.file
      );

      return {
        ...snapshot,
        mainSnapshot,
      };
    });
  }, [data, mainData]);

  if (isLoading || mainLoading) return { isLoading: true };
  if (error || mainError) return { error: error || mainError };

  return { data: snapshots };
}
