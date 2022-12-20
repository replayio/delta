import useSWR from "swr";
import { useMemo } from "react";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export function useFetchSnapshots(branch, projectQuery) {
  const { data, error, isLoading } = useSWR(
    encodeURI(`/api/getSnapshotsForBranch?branch=${branch}`),
    fetcher
  );

  const primaryBranch = projectQuery.data?.primary_branch || "main";
  console.log("primaryBranch", primaryBranch, projectQuery.data);

  const {
    data: mainData,
    error: mainError,
    isLoading: mainLoading,
  } = useSWR(
    encodeURI(`/api/getSnapshotsForBranch?branch=${primaryBranch}`),
    fetcher
  );

  console.log({ data, mainData });
  const snapshots = useMemo(() => {
    if (!data || !mainData) return null;
    return data.snapshots.map((snapshot) => {
      const mainSnapshot = mainData.snapshots.find(
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
