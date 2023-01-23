export async function fetchJSON<T>(uri: string, init?: RequestInit) {
  if (!uri.startsWith("http")) {
    if (typeof window !== undefined) {
      uri = `${window.location.origin}${uri}`;
    } else if (process.env.HOST) {
      uri = `${process.env.HOST}${uri}`;
    }
  }

  const response = await fetch(uri, init);
  const json = await response.json();
  return json as T;
}
