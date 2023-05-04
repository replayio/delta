import type {
  RequestParams as DownloadSnapshotRequestParams,
  ResponseData as DownloadSnapshotResponseData,
} from "../pages/api/downloadSnapshot";
import type {
  RequestParams as GetBranchRequestParams,
  ResponseData as GetBranchResponseData,
} from "../pages/api/getBranch";
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
  RequestParams as GetPullRequestForIdRequestParams,
  ResponseData as GetPullRequestForIdResponseData,
} from "../pages/api/getPullRequestForId";
import type {
  RequestParams as GetPullRequestForRunRequestParams,
  ResponseData as GetPullRequestForRunResponseData,
} from "../pages/api/getPullRequestForRun";
import type {
  RequestParams as GetRunsRequestParams,
  ResponseData as GetRunsResponseData,
} from "../pages/api/getRuns";
import type {
  RequestParams as GetSnapshotRequestParams,
  ResponseData as GetSnapshotResponseData,
} from "../pages/api/getSnapshot";
import type {
  RequestParams as GetSnapshotDiffsForRunRequestParams,
  ResponseData as GetSnapshotDiffsForRunResponseData,
} from "../pages/api/getSnapshotDiffsForRun";
import type {
  RequestParams as GetSnapshotsForPrimaryBranchRequestParams,
  ResponseData as GetSnapshotsForPrimaryBranchResponseData,
} from "../pages/api/getSnapshotsForPrimaryBranch";
import type {
  RequestParams as GetSnapshotsForRunRequestParams,
  ResponseData as GetSnapshotsForRunResponseData,
} from "../pages/api/getSnapshotsForRun";
import { ApiResponse } from "../pages/api/types";
import type {
  RequestParams as UpdateBranchStatusRequestParams,
  ResponseData as UpdateBranchStatusResponseData,
} from "../pages/api/updateBranchStatus";
import type {
  RequestParams as UploadSnapshotRequestParams,
  ResponseData as UploadSnapshotResponseData,
} from "../pages/api/uploadSnapshot";
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

export async function getBranch(
  params: GetBranchRequestParams
): Promise<GetBranchResponseData> {
  return fetchDataFromEndpoint<GetBranchResponseData>(
    `/api/getBranch?${paramsToUrlString(params)}`
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

export async function getPullRequestForRun(
  params: GetPullRequestForRunRequestParams
): Promise<GetPullRequestForRunResponseData> {
  return fetchDataFromEndpoint<GetPullRequestForRunResponseData>(
    `/api/getPullRequestForRun?${paramsToUrlString(params)}}`
  );
}

export async function getPullRequestForId(
  params: GetPullRequestForIdRequestParams
): Promise<GetPullRequestForIdResponseData> {
  return fetchDataFromEndpoint<GetPullRequestForIdResponseData>(
    `/api/getPullRequestForId?${paramsToUrlString(params)}}`
  );
}

export async function getPublicProjects(
  params: GetPublicProjectsRequestParams
): Promise<GetPublicProjectsResponseData> {
  return fetchDataFromEndpoint<GetPublicProjectsResponseData>(
    `/api/getPublicProjects?${paramsToUrlString(params)}}`
  );
}

export async function getSnapshotDiffsForRun(
  params: GetSnapshotDiffsForRunRequestParams
): Promise<GetSnapshotDiffsForRunResponseData> {
  return fetchDataFromEndpoint<GetSnapshotDiffsForRunResponseData>(
    `/api/getSnapshotDiffsForRun?${paramsToUrlString(params)}`
  );
}

export async function getSnapshotsForRun(
  params: GetSnapshotsForRunRequestParams
): Promise<GetSnapshotsForRunResponseData> {
  return fetchDataFromEndpoint<GetSnapshotsForRunResponseData>(
    `/api/getSnapshotsForRun?${paramsToUrlString(params)}`
  );
}

export async function getSnapshotsForPrimaryBranch(
  params: GetSnapshotsForPrimaryBranchRequestParams
): Promise<GetSnapshotsForPrimaryBranchResponseData> {
  return fetchDataFromEndpoint<GetSnapshotsForPrimaryBranchResponseData>(
    `/api/getSnapshotsForPrimaryBranch?${paramsToUrlString(params)}`
  );
}

export async function getSnapshot(
  params: GetSnapshotRequestParams
): Promise<GetSnapshotResponseData> {
  return fetchDataFromEndpoint<GetSnapshotResponseData>(
    `/api/getSnapshot?${paramsToUrlString(params)}`
  );
}

export async function updateBranchStatus(
  params: UpdateBranchStatusRequestParams
): Promise<UpdateBranchStatusResponseData> {
  return fetchDataFromEndpoint<UpdateBranchStatusResponseData>(
    `/api/updateBranchStatus?${paramsToUrlString(params)}`
  );
}

export async function uploadSnapshot(
  params: UploadSnapshotRequestParams
): Promise<UploadSnapshotResponseData> {
  const { image, ...rest } = params;
  return fetchDataFromEndpoint<UploadSnapshotResponseData>(
    `/api/uploadSnapshot?${paramsToUrlString(rest)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image }),
    }
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
