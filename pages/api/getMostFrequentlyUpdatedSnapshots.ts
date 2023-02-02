import type { NextApiRequest, NextApiResponse } from "next";
import { getMostRecentActionsFromProject } from "../../lib/server/supabase/actions";
import { getChangedSnapshotsForActions } from "../../lib/server/supabase/snapshots";

import {
  getProjectByShort,
  Snapshot,
} from "../../lib/server/supabase/supabase";
import {
  GenericResponse,
  sendErrorResponseFromPostgrestError,
  sendErrorResponse,
  sendResponse,
  sendErrorMissingParametersResponse,
} from "./utils";

type SnapshotMetadata = {
  count: number;
} & Pick<Snapshot, "file" | "path">;

export type RequestParams = {
  afterDate: string;
  projectId: string;
  projectShort: string;
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

  // If no minimum date is provided, default to the last week.
  const date = afterDate
    ? new Date(afterDate)
    : new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);

  // Convert short Project ID to id if necessary.
  if (!projectId) {
    const { data: projectData, error: projectError } = await getProjectByShort(
      projectShort
    );
    if (projectError) {
      return sendErrorResponseFromPostgrestError(response, projectError);
    } else if (!projectData) {
      return sendErrorResponse(
        response,
        `No Project found for id "${projectShort}"`,
        404
      );
    } else {
      projectId = projectData.id;
    }
  }

  // Find all recent actions for this project.
  const { data: actionsData, error: actionsError } =
    await getMostRecentActionsFromProject(projectId, date.toISOString());
  if (actionsError) {
    return sendErrorResponseFromPostgrestError(response, actionsError);
  } else if (!actionsData) {
    return sendErrorResponse(
      response,
      `No Branches found for id "${projectId}"`,
      404
    );
  }

  const actionIds = actionsData.map(({ id }) => id);

  // Find changed snapshots for recent actions
  const { data: snapshotsData, error: snapshotsError } =
    await getChangedSnapshotsForActions(actionIds);
  if (snapshotsError) {
    return sendErrorResponseFromPostgrestError(response, snapshotsError);
  } else if (!snapshotsData) {
    return sendErrorResponse(response, `No matching snapshots found`, 404);
  } else {
    const snapshotFileToMetadataMap = new Map<string, SnapshotMetadata>();
    snapshotsData.forEach((snapshot) => {
      const metadata = snapshotFileToMetadataMap.get(snapshot.file) ?? {
        count: 0,
        file: snapshot.file,
        path: snapshot.path,
      };

      snapshotFileToMetadataMap.set(snapshot.file, {
        ...metadata,
        count: metadata.count + 1,
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
