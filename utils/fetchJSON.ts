export async function fetchJSON<T>(input: string, init?: RequestInit) {
  if (!input.startsWith("http")) {
    if (typeof window !== undefined) {
      input = `${window.location.origin}${input}`;
    } else if (process.env.HOST) {
      input = `${process.env.HOST}${input}`;
    }
  }

  const response = await fetch(input, init);
  const json = await response.json();
  return json as T;
}
