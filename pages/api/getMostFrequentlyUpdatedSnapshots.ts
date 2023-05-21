import type { NextApiRequest, NextApiResponse } from "next";

import { getRecentlyUpdatedSnapshotDataForProject } from "../../lib/server/supabase/functions/getRecentlyUpdatedSnapshotDataForProject";
import { getProjectForSlug } from "../../lib/server/supabase/tables/Projects";
import { ProjectId, ProjectSlug } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./constants";
import { sendApiMissingParametersResponse, sendApiResponse } from "./utils";

export type PathMetadata = {
  count: number;
  supabasePath: string;
};

export type SnapshotMetadata = {
  imageCount: number;
  imageFileName: string;
  key: string;
  testFileName: string;
  testName: string;
  variantsToSupabasePaths: {
    [variant: string]: string[];
  };
};

export type RequestParams = {
  afterDate?: string;
  projectId?: ProjectId;
  projectSlug?: ProjectSlug;
};

export type ResponseData = SnapshotMetadata[];

// Projects have Branches have Actions have Snapshots.
// We ultimately want all recently updated Actions,
// but we need to first filter them by Branches (which are associated with a Project).

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  let { afterDate, projectId, projectSlug } = request.query as RequestParams;
  if (!projectId && !projectSlug) {
    return sendApiMissingParametersResponse(request, response, {
      projectId,
      projectSlug,
    });
  }

  // Convert short Project ID to id if necessary.
  if (!projectId) {
    const project = await getProjectForSlug(projectSlug!);
    projectId = project.id;
  }

  // Find all recent snapshots for this project.
  try {
    const { data, error } = await getRecentlyUpdatedSnapshotDataForProject(
      projectId,
      afterDate
        ? new Date(afterDate)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    if (error != null) {
      throw error;
    }

    const snapshotMetadataMap = new Map<string, SnapshotMetadata>();
    data?.forEach((record) => {
      const {
        delta_image_filename: imageFileName,
        delta_test_filename: testFileName,
        delta_test_name: testName,
        delta_variant: variant,
        supabase_path: supabasePath,
      } = record;

      const key = `${testFileName}:${testName}:${imageFileName}`;

      let snapshotMetadata = snapshotMetadataMap.get(key);
      if (snapshotMetadata == null) {
        snapshotMetadata = {
          imageCount: 0,
          imageFileName,
          key,
          testFileName,
          testName,
          variantsToSupabasePaths: {},
        };
        snapshotMetadataMap.set(key, snapshotMetadata);
      }

      let supabasePaths = snapshotMetadata.variantsToSupabasePaths[variant];
      if (supabasePaths == null) {
        snapshotMetadata.variantsToSupabasePaths[variant] = supabasePaths = [];
      }

      if (supabasePaths.indexOf(supabasePath) < 0) {
        snapshotMetadata.imageCount++;
        supabasePaths.push(supabasePath);
      }
    });

    return sendApiResponse<ResponseData>(request, response, {
      httpStatusCode: HTTP_STATUS_CODES.OK,
      data: Array.from(snapshotMetadataMap.values())
        .filter(
          (record) =>
            record.imageCount >
            Object.keys(record.variantsToSupabasePaths).length
        )
        .sort((a, b) => b.imageCount - a.imageCount),
    });
  } catch (error) {
    return sendApiResponse(request, response, {
      data: error,
      deltaErrorCode: DELTA_ERROR_CODE.STORAGE.DOWNLOAD_FAILED,
      httpStatusCode: HTTP_STATUS_CODES.NOT_FOUND,
    });
  }
}
