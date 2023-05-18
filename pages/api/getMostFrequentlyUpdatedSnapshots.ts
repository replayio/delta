import type { NextApiRequest, NextApiResponse } from "next";

import { getMostRecentlyUpdatedSnapshotsForProject } from "../../lib/server/supabase/functions/recently_updated_snapshots_for_project";
import { getProjectForSlug } from "../../lib/server/supabase/tables/Projects";
import { ProjectId, ProjectSlug } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./constants";
import { sendApiMissingParametersResponse, sendApiResponse } from "./utils";

export type PathMetadata = {
  count: number;
  path: string;
};

export type SnapshotMetadata = {
  count: number;
  file: string;
  paths: PathMetadata[];
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
    const records = await getMostRecentlyUpdatedSnapshotsForProject(
      projectId,
      afterDate
        ? new Date(afterDate)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    const pathMetadataMap = new Map<string, PathMetadata>();
    const snapshotFileToMetadataMap = new Map<string, SnapshotMetadata>();
    records.body?.forEach((record) => {
      const metadata: SnapshotMetadata = snapshotFileToMetadataMap.get(
        record.delta_file
      ) ?? {
        count: 0,
        file: record.delta_file,
        paths: [],
      };

      const key = `${record.delta_file}:${record.delta_path}}`;
      const pathMetadata = pathMetadataMap.get(key) ?? {
        count: 0,
        path: record.delta_path,
      };
      pathMetadata.count++;
      pathMetadataMap.set(key, pathMetadata);

      snapshotFileToMetadataMap.set(record.delta_file, {
        ...metadata,
        count: metadata.count + 1,
        paths:
          pathMetadata.count === 1
            ? [...metadata.paths, pathMetadata]
            : metadata.paths,
      });
    });

    const data = Array.from(snapshotFileToMetadataMap.values())
      .filter((record) => record.count > 1)
      .sort((a, b) => b.count - a.count);

    return sendApiResponse<ResponseData>(request, response, {
      httpStatusCode: HTTP_STATUS_CODES.OK,
      data,
    });
  } catch (error) {
    return sendApiResponse(request, response, {
      data: error,
      deltaErrorCode: DELTA_ERROR_CODE.STORAGE.DOWNLOAD_FAILED,
      httpStatusCode: HTTP_STATUS_CODES.NOT_FOUND,
    });
  }
}
