import type {
  RequestParams as DownloadSnapshotRequestParams,
  ResponseData as DownloadSnapshotResponseData,
} from "../pages/api/downloadSnapshot";
import type {
  RequestParams as GetBranchesRequestParams,
  ResponseData as GetBranchesResponseData,
} from "../pages/api/getBranches";
import type {
  RequestParams as GetDiffImageRequestParams,
  ResponseData as GetDiffImageResponseData,
} from "../pages/api/getDiffImage";
import type {
  RequestParams as GetMostFrequentlyUpdatedSnapshotsRequestParams,
  ResponseData as GetMostFrequentlyUpdatedSnapshotsResponseData,
} from "../pages/api/getMostFrequentlyUpdatedSnapshots";
import type {
  RequestParams as GetProjectRequestParams,
  ResponseData as GetProjectResponseData,
} from "../pages/api/getProject";
import type {
  RequestParams as GetPublicProjectsRequestParams,
  ResponseData as GetPublicProjectsResponseData,
} from "../pages/api/getPublicProjects";
import type {
  RequestParams as GetRunsRequestParams,
  ResponseData as GetRunsResponseData,
} from "../pages/api/getRuns";
import type {
  RequestParams as GetSnapshotDiffCountForRunRequestParams,
  ResponseData as GetSnapshotDiffCountForRunResponseData,
} from "../pages/api/getSnapshotDiffCountForRun";
import type {
  RequestParams as GetSnapshotDiffsForRunRequestParams,
  ResponseData as GetSnapshotDiffsForRunResponseData,
} from "../pages/api/getSnapshotDiffsForRun";
import { ApiResponse } from "../pages/api/types";
import type {
  RequestParams as UpdateBranchStatusRequestParams,
  ResponseData as UpdateBranchStatusResponseData,
} from "../pages/api/updateBranchStatus";
import { isApiErrorResponse } from "../pages/api/utils";
import { fetchJSON } from "./fetchJSON";

// All requests made between the Client and Server should use the functions in this module to ensure proper TypeScript typing.

export async function downloadSnapshot(
  params: DownloadSnapshotRequestParams
): Promise<DownloadSnapshotResponseData> {
  return fetchDataFromEndpoint<DownloadSnapshotResponseData>(
    `/api/downloadSnapshot?${paramsToUrlString(params)}`
  );
}

export async function getDiffImage(
  params: GetDiffImageRequestParams
): Promise<GetDiffImageResponseData> {
  return fetchDataFromEndpoint<GetDiffImageResponseData>(
    `/api/getDiffImage?${paramsToUrlString(params)}`
  );
}

export async function getMostFrequentlyUpdatedSnapshots(
  params: GetMostFrequentlyUpdatedSnapshotsRequestParams
): Promise<GetMostFrequentlyUpdatedSnapshotsResponseData> {
  return fetchDataFromEndpoint<GetMostFrequentlyUpdatedSnapshotsResponseData>(
    `/api/getMostFrequentlyUpdatedSnapshots?${paramsToUrlString(params)}`
  );
}

export async function getRuns(
  params: GetRunsRequestParams
): Promise<GetRunsResponseData> {
  return fetchDataFromEndpoint<GetRunsResponseData>(
    `/api/getRuns?${paramsToUrlString(params)}`
  );
}

export async function getBranches(
  params: GetBranchesRequestParams
): Promise<GetBranchesResponseData> {
  return fetchDataFromEndpoint<GetBranchesResponseData>(
    `/api/getBranches?${paramsToUrlString(params)}`
  );
}

export async function getProject(
  params: GetProjectRequestParams
): Promise<GetProjectResponseData> {
  return fetchDataFromEndpoint<GetProjectResponseData>(
    `/api/getProject?${paramsToUrlString(params)}`
  );
}

export async function getPublicProjects(
  params: GetPublicProjectsRequestParams
): Promise<GetPublicProjectsResponseData> {
  return fetchDataFromEndpoint<GetPublicProjectsResponseData>(
    `/api/getPublicProjects?${paramsToUrlString(params)}}`
  );
}

export async function getSnapshotDiffCountForRun(
  params: GetSnapshotDiffCountForRunRequestParams
): Promise<GetSnapshotDiffCountForRunResponseData> {
  return fetchDataFromEndpoint<GetSnapshotDiffCountForRunResponseData>(
    `/api/getSnapshotDiffCountForRun?${paramsToUrlString(params)}`
  );
}

export async function getSnapshotDiffsForRun(
  params: GetSnapshotDiffsForRunRequestParams
): Promise<GetSnapshotDiffsForRunResponseData> {
  return fetchDataFromEndpoint<GetSnapshotDiffsForRunResponseData>(
    `/api/getSnapshotDiffsForRun?${paramsToUrlString(params)}`
  );
}

export async function updateBranchStatus(
  params: UpdateBranchStatusRequestParams
): Promise<UpdateBranchStatusResponseData> {
  return fetchDataFromEndpoint<UpdateBranchStatusResponseData>(
    `/api/updateBranchStatus?${paramsToUrlString(params)}`
  );
}

async function fetchDataFromEndpoint<Type>(
  url: string,
  init?: RequestInit
): Promise<Type> {
  const response = await fetchJSON<ApiResponse<Type>>(url, init);

  if (isApiErrorResponse(response)) {
    throw response.data;
  }

  return response.data;
}

function paramsToUrlString(params: Object): string {
  return Object.keys(params)
    .map((key) => `${key}=${params[key] || ""}`)
    .join("&");
}
