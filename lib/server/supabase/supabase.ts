import createClient from "../../initServerSupabase";

export const supabase = createClient();

export type ResponseError = {
  data: null;
  error: string;
};

export const createError = (error: string): ResponseError => ({
  data: null,
  error,
});

export async function maybeRetry<T>(
  fn: () => PromiseLike<T>,
  shouldRetry: (t: T) => boolean
): Promise<T> {
  const callerStackTrace = Error().stack;
  let result: T;
  try {
    result = await fn();
    if (!shouldRetry(result)) {
      return result;
    }
    console.error("received error, retrying", result, callerStackTrace);
  } catch (error) {
    console.error("caught error, retrying", error, callerStackTrace);
  }
  try {
    result = await fn();
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
  fn: () => PromiseLike<T>
): Promise<T> {
  return maybeRetry(
    fn,
    (result) =>
      !!result.error &&
      result.error.message !==
        "JSON object requested, multiple (or no) rows returned"
  );
}
