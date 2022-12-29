import useSWR from "swr";
import { useMemo } from "react";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export function useFetchSnapshots(branch, projectQuery) {
  const selectedKey = encodeURI(
    projectQuery.isLoading || projectQuery.error
      ? null
      : `/api/getSnapshotsForBranch?branch=${branch}&project_id=${projectQuery.data.id}`
  );
  console.log("selectedKey", selectedKey);
  const { data, error, isLoading } = useSWR(selectedKey, fetcher);

  const primaryBranch = projectQuery.data?.primary_branch;
  const primaryKey =
    projectQuery.isLoading || projectQuery.error
      ? null
      : encodeURI(
          `/api/getSnapshotsForBranch?branch=${primaryBranch}&project_id=${projectQuery.data.id}`
        );

  console.log("primaryKey", primaryKey);
  const {
    data: mainData,
    error: mainError,
    isLoading: mainLoading,
  } = useSWR(primaryKey, fetcher);

  console.log({ data, mainData });
  const snapshots = useMemo(() => {
    if (!data || !mainData) return null;
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

  console.log(`snapshots`, snapshots);
  return { data: snapshots };
}
