import {
  PostgrestResponse,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";
import createClient from "../../initServerSupabase";
import { DeltaErrorCode } from "../../../pages/api/constants";
import { createErrorFromPostgrestError } from "../../../pages/api/utils";

export const supabase = createClient();

export type ResponseError = {
  data: null;
  error: string;
};

export const createError = (error: string): ResponseError => ({
  data: null,
  error,
});

// Runs query and throws if it fails
export async function assertQuery(
  runQuery: () => PromiseLike<PostgrestResponse<unknown>>,
  failureMessage: string
): Promise<void> {
  const result = await retryOnError(runQuery);
  if (result.error) {
    throw createErrorFromPostgrestError(result.error, failureMessage);
  }
}

// Returns a set of records of type <Type> or throws
export async function assertQueryResponse<Type>(
  runQuery: () => PromiseLike<PostgrestResponse<Type>>,
  failureMessage: string
): Promise<Type[]> {
  const result = await retryOnError(runQuery);
  if (result.error || result.data == null) {
    const error = result.error
      ? createErrorFromPostgrestError(result.error, failureMessage)
      : new Error(failureMessage);

    throw error;
  }

  return result.data;
}

// Returns a single record of type <Type> or throws
export async function assertQuerySingleResponse<Type>(
  runQuery: () => PromiseLike<PostgrestSingleResponse<Type>>,
  failureMessage: string
): Promise<Type> {
  const result = await retryOnError(runQuery);
  if (result.error || result.data == null) {
    const error = result.error
      ? createErrorFromPostgrestError(result.error, failureMessage)
      : new Error(failureMessage);

    throw error;
  }

  return result.data;
}

// Returns a single record of type <Type> (or null if none found);
// throws if there is a Postgrest error
export async function assertQuerySingleResponseOrNull<Type>(
  runQuery: () => PromiseLike<PostgrestSingleResponse<Type>>,
  failureMessage: string
): Promise<Type | null> {
  const result = await retryOnError(runQuery);
  if (result.error) {
    const error = result.error
      ? createErrorFromPostgrestError(result.error, failureMessage)
      : new Error(failureMessage);

    throw error;
  }

  return result.data;
}

// Runs query and throws if it fails
export async function assertStorage(
  runQuery: () => PromiseLike<{
    data: unknown | null;
    error: Error | null;
  }>,
  failureMessage: string
): Promise<void> {
  const result = await retryOnError(runQuery);
  if (result.error) {
    throw new Error(`${failureMessage}\n\n${result.error}`);
  }
}

// Returns a single value from of type <Type> or throws
export async function assertStorageValue<Type>(
  runQuery: () => PromiseLike<{
    data: Type | null;
    error: Error | null;
  }>,
  failureMessage: string
): Promise<Type> {
  const result = await retryOnError(runQuery);
  if (result.error || result.data == null) {
    let error = result.error;
    if (!error) {
      error = new Error(failureMessage);
    } else {
      error.message = `${failureMessage}\n\n${error.message}`;
    }

    throw error;
  }

  return result.data;
}

export async function maybeRetry<T>(
  runQuery: () => PromiseLike<T>,
  shouldRetry: (t: T) => boolean
): Promise<T> {
  const callerStackTrace = Error().stack;
  let result: T;
  try {
    result = await runQuery();
    if (!shouldRetry(result)) {
      return result;
    }
    console.error("received error, retrying", result, callerStackTrace);
  } catch (error) {
    console.error("caught error, retrying", error, callerStackTrace);
  }
  try {
    result = await runQuery();
    if (!shouldRetry(result)) {
      return result;
    }
    console.error("received error, giving up", result);
    return result;
  } catch (error) {
    console.error("caught error, giving up", error);
    throw error;
  }
}

export async function retryOnError<T extends { error: any }>(
  runQuery: () => PromiseLike<T>
): Promise<T> {
  return maybeRetry(
    runQuery,
    (result) =>
      !!result.error &&
      result.error.message !==
        "JSON object requested, multiple (or no) rows returned"
  );
}
