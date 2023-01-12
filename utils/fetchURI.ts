import fetch, { RequestInit } from "node-fetch";

export async function fetchURI(
  uri: string,
  init?: RequestInit
): Promise<JSON | string | null> {
  try {
    const encodedURI = encodeURI(uri);
    const response = await fetch(encodedURI, init);
    console.log(`fetchUrl() Response status: "${response.status}"`);

    if (response.status > 299) {
      const text = await response.text();
      console.log("fetchUrl() Response text:\n", text);
      return text;
    }

    const json = (await response.json()) as JSON;
    console.log("fetchUrl() Response json:\n", json);
    return json;
  } catch (error) {
    console.error("fetchUrl() error", error);
  }

  return null;
}
