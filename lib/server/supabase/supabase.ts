import {
  PostgrestResponse,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";
import { createErrorFromPostgrestError } from "../../../pages/api/utils";

export type ResponseError = {
  data: null;
  error: string;
};

export const createError = (error: string): ResponseError => ({
  data: null,
  error,
});

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
export async function assertQueryMaybeSingleResponse<Type>(
  runQuery: () => PromiseLike<PostgrestSingleResponse<Type>>,
  failureMessage: string
): Promise<Type | null> {
  const result = await retryOnError(runQuery);
  if (result.error) {
    const error = createErrorFromPostgrestError(result.error, failureMessage);

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

export async function maybeRetry<Type>(
  runQuery: () => PromiseLike<Type>,
  throwOnBadResult: (result: Type) => void
): Promise<Type> {
  let didRetry = false;

  while (true) {
    try {
      const result = await runQuery();

      throwOnBadResult(result);

      return result;
    } catch (error) {
      console.error(error);

      if (didRetry) {
        throw error;
      } else {
        console.log("Retrying...");
      }
    }
  }
}

export async function retryOnError<Type extends { error: any }>(
  runQuery: () => PromiseLike<Type>
): Promise<Type> {
  return maybeRetry(runQuery, ({ error }) => {
    if (
      !!error &&
      !error.message.includes(
        "JSON object requested, multiple (or no) rows returned"
      )
    ) {
      throw error;
    }
  });
}
