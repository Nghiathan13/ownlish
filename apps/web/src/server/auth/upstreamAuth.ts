import { getAuthApiBaseUrl } from "@/server/auth/constants";

export async function postUpstreamAuth(
  path: string,
  body: string,
): Promise<{ json: unknown; upstream: Response }> {
  const upstream = await fetch(`${getAuthApiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });

  const json = await upstream.json().catch(() => null);

  return { upstream, json };
}
