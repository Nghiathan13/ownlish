import { afterEach, describe, expect, it, vi } from "vitest";

import { postUpstreamAuth } from "@/_app/api-routes/auth/lib/upstreamAuth";

describe("postUpstreamAuth", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.AUTH_API_BASE_URL;
  });

  it("posts JSON to the configured auth API and merges caller headers", async () => {
    process.env.AUTH_API_BASE_URL = "https://auth.example.test";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ accessToken: "token" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await postUpstreamAuth("/auth/google", "{\"idToken\":\"id\"}", {
      "X-Requested-With": "XMLHttpRequest",
    });

    expect(fetchMock).toHaveBeenCalledWith("https://auth.example.test/auth/google", {
      method: "POST",
      headers: expect.any(Headers),
      body: '{"idToken":"id"}',
    });
    const headers = fetchMock.mock.calls[0]?.[1].headers as Headers;
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("X-Requested-With")).toBe("XMLHttpRequest");
    expect(result.json).toEqual({ accessToken: "token" });
    expect(result.upstream.status).toBe(200);
  });

  it("returns null when the upstream body is not JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("unavailable", { status: 503 })));

    const result = await postUpstreamAuth("/auth/login", "{}");

    expect(result.json).toBeNull();
    expect(result.upstream.status).toBe(503);
  });
});
