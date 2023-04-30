import type {
  RequestParams as DownloadSnapshotRequestParams,
  ResponseData as DownloadSnapshotResponseData,
} from "../pages/api/downloadSnapshot";
import type {
  RequestParams as GetActionsRequestParams,
  ResponseData as GetActionsResponseData,
} from "../pages/api/getActions";
import type {
  RequestParams as GetBranchByNameRequestParams,
  ResponseData as GetBranchByNameResponseData,
} from "../pages/api/getBranchByName";
import type {
  RequestParams as GetBranchesRequestParams,
  ResponseData as GetBranchesResponseData,
} from "../pages/api/getBranches";
import type {
  RequestParams as GetJobsRequestParams,
  ResponseData as GetJobsResponseData,
} from "../pages/api/getJobs";
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
  RequestParams as GetSnapshotRequestParams,
  ResponseData as GetSnapshotResponseData,
} from "../pages/api/getSnapshot";
import type {
  RequestParams as GetSnapshotDiffRequestParams,
  ResponseData as GetSnapshotDiffResponseData,
} from "../pages/api/getSnapshotDiff";
import type {
  RequestParams as GetSnapshotsForBranchRequestParams,
  ResponseData as GetSnapshotsForBranchResponseData,
} from "../pages/api/getSnapshotsForBranch";
import type {
  RequestParams as GetSnapshotsForJobRequestParams,
  ResponseData as GetSnapshotsForJobResponseData,
} from "../pages/api/getSnapshotsForJob";
import type {
  RequestParams as UpdateBranchStatusRequestParams,
  ResponseData as UpdateBranchStatusResponseData,
} from "../pages/api/updateBranchStatus";
import type {
  RequestParams as UploadSnapshotRequestParams,
  ResponseData as UploadSnapshotResponseData,
} from "../pages/api/uploadSnapshot";
import { GenericResponse, isErrorResponse } from "../pages/api/utils";
import { fetchJSON } from "./fetchJSON";

// All requests made between the Client and Server should use the functions in this module to ensure proper TypeScript typing.

export async function downloadSnapshot(
  params: DownloadSnapshotRequestParams
): Promise<DownloadSnapshotResponseData> {
  return fetchDataFromEndpoint<DownloadSnapshotResponseData>(
    `/api/downloadSnapshot?${paramsToUrlString(params)}`
  );
}

export async function getActions(
  params: GetActionsRequestParams
): Promise<GetActionsResponseData> {
  return fetchDataFromEndpoint<GetActionsResponseData>(
    `/api/getActions?${paramsToUrlString(params)}`
  );
}

export async function getMostFrequentlyUpdatedSnapshots(
  params: GetMostFrequentlyUpdatedSnapshotsRequestParams
): Promise<GetMostFrequentlyUpdatedSnapshotsResponseData> {
  return fetchDataFromEndpoint<GetMostFrequentlyUpdatedSnapshotsResponseData>(
    `/api/getMostFrequentlyUpdatedSnapshots?${paramsToUrlString(params)}`
  );
}

export async function getJobs(
  params: GetJobsRequestParams
): Promise<GetJobsResponseData> {
  return fetchDataFromEndpoint<GetJobsResponseData>(
    `/api/getJobs?${paramsToUrlString(params)}`
  );
}

export async function getBranchByName(
  params: GetBranchByNameRequestParams
): Promise<GetBranchByNameResponseData> {
  return fetchDataFromEndpoint<GetBranchByNameResponseData>(
    `/api/getBranchByName?${paramsToUrlString(params)}`
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

export async function getSnapshotDiff(
  params: GetSnapshotDiffRequestParams
): Promise<GetSnapshotDiffResponseData> {
  return fetchDataFromEndpoint<GetSnapshotDiffResponseData>(
    `/api/getSnapshotDiff?${paramsToUrlString(params)}`
  );
}

export async function getSnapshotsForJob(
  params: GetSnapshotsForJobRequestParams
): Promise<GetSnapshotsForJobResponseData> {
  return fetchDataFromEndpoint<GetSnapshotsForJobResponseData>(
    `/api/getSnapshotsForJob?${paramsToUrlString(params)}`
  );
}

export async function getSnapshotsForBranch(
  params: GetSnapshotsForBranchRequestParams
): Promise<GetSnapshotsForBranchResponseData> {
  return fetchDataFromEndpoint<GetSnapshotsForBranchResponseData>(
    `/api/getSnapshotsForBranch?${paramsToUrlString(params)}`
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

async function fetchDataFromEndpoint<ResponseData>(
  url: string,
  init?: RequestInit
): Promise<ResponseData> {
  const response = await fetchJSON<GenericResponse<ResponseData>>(url, init);

  if (isErrorResponse(response)) {
    throw response.error;
  }

  return response.data;
}

function paramsToUrlString(params: Object): string {
  return Object.keys(params)
    .map((key) => `${key}=${params[key] || ""}`)
    .join("&");
}
