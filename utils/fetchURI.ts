import fetch from "node-fetch";

export async function fetchURI(uri: string): Promise<JSON | string | null> {
  try {
    const encodedURI = encodeURI(uri);
    const response = await fetch(encodedURI);
    console.log(`fetchUrl() Response status: "${response.status}"`);

    if (response.status !== 200) {
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
