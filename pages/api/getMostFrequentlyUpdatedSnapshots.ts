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

export type RequestParams = {
  afterDate?: string;
  projectId?: ProjectId;
  projectSlug?: ProjectSlug;
};

export type RunMetadata = {
  githubRunId: number;
  timestamp: string;
};

export type SupabasePathToMetadata = {
  [supabasePath: string]: RunMetadata[];
};

export type SupabaseVariantMetadata = {
  [variant: string]: SupabasePathToMetadata;
};

export type ImageFilenameToSupabasePathMetadata = {
  [imageFilename: string]: SupabaseVariantMetadata;
};

export type TestNameToImageFilenameMetadata = {
  [testName: string]: ImageFilenameToSupabasePathMetadata;
};

export type TestFilenameToTestNameMetadata = {
  [testFilename: string]: TestNameToImageFilenameMetadata;
};

export type ResponseData = TestFilenameToTestNameMetadata;

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

    const responseData: ResponseData = {};
    data?.forEach((record) => {
      const {
        created_at: createdAt,
        delta_image_filename: imageFilename,
        delta_test_filename: testFilename,
        delta_test_name: testName,
        delta_variant: variant,
        github_run_id: githubRunId,
        supabase_path: supabasePath,
      } = record;

      let testFileMetadata = responseData[testFilename];
      if (testFileMetadata == null) {
        responseData[testFilename] = testFileMetadata = {};
      }

      let testNameMetadata = testFileMetadata[testName];
      if (testNameMetadata == null) {
        testFileMetadata[testName] = testNameMetadata = {};
      }

      let imageFilenameMetadata = testNameMetadata[imageFilename];
      if (imageFilenameMetadata == null) {
        testNameMetadata[imageFilename] = imageFilenameMetadata = {};
      }

      let variantMetadata = imageFilenameMetadata[variant];
      if (variantMetadata == null) {
        imageFilenameMetadata[variant] = variantMetadata = {};
      }

      let dates = variantMetadata[supabasePath];
      if (dates == null) {
        variantMetadata[supabasePath] = dates = [];
      }

      dates.push({
        githubRunId,
        timestamp: createdAt,
      });
    });

    // Filter out all tests with only a single snapshot path per variant.
    // Those are stable for the purposes of this endpoint.
    for (let testFilename in responseData) {
      const testFileMetadata = responseData[testFilename];
      for (let testName in testFileMetadata) {
        const testNameMetadata = testFileMetadata[testName];
        for (let imageFilename in testNameMetadata) {
          const imageFilenameMetadata = testNameMetadata[imageFilename];
          for (let variant in imageFilenameMetadata) {
            const variantMetadata = imageFilenameMetadata[variant];

            if (Object.keys(variantMetadata).length === 1) {
              delete imageFilenameMetadata[variant];
            }
          }

          if (Object.keys(imageFilenameMetadata).length === 0) {
            delete testNameMetadata[imageFilename];
          }
        }

        if (Object.keys(testNameMetadata).length === 0) {
          delete testFileMetadata[testName];
        }
      }

      if (Object.keys(testFileMetadata).length === 0) {
        delete responseData[testFilename];
      }
    }

    return sendApiResponse<ResponseData>(request, response, {
      httpStatusCode: HTTP_STATUS_CODES.OK,
      data: responseData,
    });
  } catch (error) {
    return sendApiResponse(request, response, {
      data: error,
      deltaErrorCode: DELTA_ERROR_CODE.STORAGE.DOWNLOAD_FAILED,
      httpStatusCode: HTTP_STATUS_CODES.NOT_FOUND,
    });
  }
}
