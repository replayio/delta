import fetch, { RequestInit } from "node-fetch";

export async function fetchURI(
  uri: string,
  init?: RequestInit
): Promise<JSON | string | null> {
  try {
    const encodedURI = encodeURI(uri);
    const response = await fetch(encodedURI, init);

    if (response.status > 299) {
      const text = await response.text();
      return text;
    }

    const json = (await response.json()) as JSON;
    return json;
  } catch (error) {
    console.error("fetchUrl() error", error);
  }

  return null;
}
