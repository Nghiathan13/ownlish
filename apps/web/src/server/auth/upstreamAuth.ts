import { getAuthApiBaseUrl } from "@/server/auth/constants";

export async function postUpstreamAuth(
  path: string,
  body: string,
  extraHeaders?: HeadersInit,
): Promise<{ json: unknown; upstream: Response }> {
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (extraHeaders) {
    for (const [name, value] of new Headers(extraHeaders)) {
      headers.set(name, value);
    }
  }

  const upstream = await fetch(`${getAuthApiBaseUrl()}${path}`, {
    method: "POST",
    headers,
    body,
  });

  const json = await upstream.json().catch(() => null);

  return { upstream, json };
}
