export type HttpStatusCode = { code: number; type: "HttpStatusCode" };

function createHttpStatusCode(code: number): HttpStatusCode {
  return { code, type: "HttpStatusCode" };
}

export const HTTP_STATUS_CODES = {
  OK: createHttpStatusCode(200),
  NO_CONTENT: createHttpStatusCode(204),
  BAD_REQUEST: createHttpStatusCode(400),
  NOT_FOUND: createHttpStatusCode(404),
  EXPECTATION_FAILED: createHttpStatusCode(417),
  FAILED_DEPENDENCY: createHttpStatusCode(424),
  INTERNAL_SERVER_ERROR: createHttpStatusCode(500),
};

export type DeltaErrorCode = { code: number; type: "DeltaErrorCode" };

function createDeltaErrorCode(code: number): DeltaErrorCode {
  return { code, type: "DeltaErrorCode" };
}

export const DELTA_ERROR_CODE = {
  UNKNOWN_ERROR: createDeltaErrorCode(1000),
  DIFF_FAILED: createDeltaErrorCode(1001),
  MISSING_PARAMETERS: createDeltaErrorCode(1002),
  INVALID_STATE: createDeltaErrorCode(1004),

  DATABASE: {
    INSERT_FAILED: createDeltaErrorCode(2000),
    SELECT_FAILED: createDeltaErrorCode(2001),
    FUNCTION_FAILED: createDeltaErrorCode(2002),
    UPDATE_FAILED: createDeltaErrorCode(2003),
  },

  STORAGE: {
    DOWNLOAD_FAILED: createDeltaErrorCode(3000),
    UPLOAD_FAILED: createDeltaErrorCode(3001),
  },

  API: {
    REQUEST_FAILED: createDeltaErrorCode(4000),
    UNHANDLED_EVENT_TYPE: createDeltaErrorCode(4001),
    UNHANDLED_WORKFLOW_TYPE: createDeltaErrorCode(4002),
  },
};
