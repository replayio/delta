import { safeStringify } from "./server/json";

const HOST = process.env.HOST;

export async function post(path: string, body: any) {
  const res = await fetch(`${HOST}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: safeStringify(body),
  });

  if (res.status === 200) {
    return { status: 200, data: res.json() };
  }

  return { status: res.status, error: await res.text() };
}
