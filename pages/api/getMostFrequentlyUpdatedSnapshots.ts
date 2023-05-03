import type { NextApiRequest, NextApiResponse } from "next";

import { getProjectForSlug } from "../../lib/server/supabase/tables/Projects";
import { getRecentlyUpdatedSnapshotsForProject } from "../../lib/server/supabase/tables/Snapshots";
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
    return sendApiMissingParametersResponse(response, {
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
    const snapshots = await getRecentlyUpdatedSnapshotsForProject(
      projectId,
      afterDate
        ? new Date(afterDate)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    const pathMetadataMap = new Map<string, PathMetadata>();
    const snapshotFileToMetadataMap = new Map<string, SnapshotMetadata>();
    snapshots.forEach((snapshot) => {
      const metadata: SnapshotMetadata = snapshotFileToMetadataMap.get(
        snapshot.delta_file
      ) ?? {
        count: 0,
        file: snapshot.delta_file,
        paths: [],
      };

      const key = `${snapshot.delta_file}:${snapshot.delta_path}}`;
      const pathMetadata = pathMetadataMap.get(key) ?? {
        count: 0,
        path: snapshot.delta_path,
      };
      pathMetadata.count++;
      pathMetadataMap.set(key, pathMetadata);

      snapshotFileToMetadataMap.set(snapshot.delta_file, {
        ...metadata,
        count: metadata.count + 1,
        paths:
          pathMetadata.count === 1
            ? [...metadata.paths, pathMetadata]
            : metadata.paths,
      });
    });

    const data = Array.from(snapshotFileToMetadataMap.values()).sort(
      (a, b) => b.count - a.count
    );

    return sendApiResponse<ResponseData>(response, {
      httpStatusCode: HTTP_STATUS_CODES.OK,
      data,
    });
  } catch (error) {
    return sendApiResponse(response, {
      data: error,
      deltaErrorCode: DELTA_ERROR_CODE.STORAGE.DOWNLOAD_FAILED,
      httpStatusCode: HTTP_STATUS_CODES.NOT_FOUND,
    });
  }
}
