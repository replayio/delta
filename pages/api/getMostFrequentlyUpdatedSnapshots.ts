import type { NextApiRequest, NextApiResponse } from "next";
import { getMostRecentlyChangedSnapshotsForProject } from "../../lib/server/supabase/snapshots";

import { getProjectForShort } from "../../lib/server/supabase/projects";
import { ProjectId, ProjectShort } from "../../lib/types";
import { DELTA_ERROR_CODE, HTTP_STATUS_CODES } from "./statusCodes";
import {
  GenericResponse,
  sendErrorMissingParametersResponse,
  sendErrorResponse,
  sendErrorResponseFromPostgrestError,
  sendResponse,
} from "./utils";

export type PathMetadata = {
  count: number;
  diffPath: string;
  numPixelsChanged: number;
  path: string;
};

export type SnapshotMetadata = {
  count: number;
  file: string;
  paths: PathMetadata[];
};

export type RequestParams = {
  afterDate: string;
  projectId?: ProjectId;
  projectShort?: ProjectShort;
};
export type ResponseData = SnapshotMetadata[];
export type Response = GenericResponse<ResponseData>;

// Projects have Branches have Actions have Snapshots.
// We ultimately want all recently updated Actions,
// but we need to first filter them by Branches (which are associated with a Project).

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Response>
) {
  let { afterDate, projectId, projectShort } = request.query as RequestParams;
  console.log("request.query:", request.query);
  if (!projectId && !projectShort) {
    return sendErrorMissingParametersResponse(response, {
      projectId,
      projectShort,
    });
  }

  // Convert short Project ID to id if necessary.
  if (!projectId) {
    const { data: projectData, error: projectError } = await getProjectForShort(
      projectShort as ProjectShort
    );
    if (projectError) {
      return sendErrorResponseFromPostgrestError(
        response,
        projectError,
        HTTP_STATUS_CODES.NOT_FOUND,
        DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
        `No Project found for short id "${projectShort}"`
      );
    } else if (!projectData) {
      return sendErrorResponse(
        response,
        `No Project found for short id "${projectShort}"`,
        HTTP_STATUS_CODES.NOT_FOUND,
        DELTA_ERROR_CODE.DATABASE.SELECT_FAILED
      );
    } else {
      projectId = projectData.id;
    }
  }

  // Find all recent snapshots for this project.
  const { data: snapshotsData, error: snapshotsError } =
    await getMostRecentlyChangedSnapshotsForProject(
      projectId,
      afterDate ? new Date(afterDate) : undefined
    );
  if (snapshotsError) {
    return sendErrorResponseFromPostgrestError(
      response,
      snapshotsError,
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.DATABASE.SELECT_FAILED,
      `Recent Snapshot data could not be found for Project id "${projectId}" after date "${
        afterDate ?? "N/A"
      }"`
    );
  } else if (!snapshotsData) {
    return sendErrorResponse(
      response,
      `No matching snapshots found`,
      HTTP_STATUS_CODES.NOT_FOUND,
      DELTA_ERROR_CODE.UNKNOWN_ERROR
    );
  } else {
    const pathMetadataMap = new Map<string, PathMetadata>();
    const snapshotFileToMetadataMap = new Map<string, SnapshotMetadata>();
    snapshotsData.forEach((snapshot) => {
      const metadata: SnapshotMetadata = snapshotFileToMetadataMap.get(
        snapshot.file
      ) ?? {
        count: 0,
        file: snapshot.file,
        paths: [],
      };

      const key = `${snapshot.file}:${snapshot.path}}`;
      const pathMetadata = pathMetadataMap.get(key) ?? {
        count: 0,
        diffPath: snapshot.primary_diff_path!,
        numPixelsChanged: snapshot.primary_num_pixels,
        path: snapshot.path,
      };
      pathMetadata.count++;
      pathMetadataMap.set(key, pathMetadata);

      snapshotFileToMetadataMap.set(snapshot.file, {
        ...metadata,
        count: metadata.count + 1,
        paths:
          pathMetadata.count === 1
            ? [...metadata.paths, pathMetadata]
            : metadata.paths,
      });
    });

    return sendResponse<ResponseData>(
      response,
      Array.from(snapshotFileToMetadataMap.values()).sort(
        (a, b) => b.count - a.count
      )
    );
  }
}
