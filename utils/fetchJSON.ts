export async function fetchJSON(input: string, init?: RequestInit) {
  const response = await fetch(input, init);
  const json = await response.json();
  return json;
}
