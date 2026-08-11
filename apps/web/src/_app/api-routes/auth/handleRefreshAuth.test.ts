import { beforeEach, describe, expect, it, vi } from "vitest";
import { REFRESH_COOKIE_NAME } from "@/_app/api-routes/auth/constants";

const { cookiesMock, postUpstreamAuthMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  postUpstreamAuthMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/_app/api-routes/auth/upstreamAuth", () => ({
  postUpstreamAuth: postUpstreamAuthMock,
}));

import { handleRefreshAuth } from "@/_app/api-routes/auth/handleRefreshAuth";

function mockRefreshCookie(value?: string): void {
  cookiesMock.mockResolvedValue({
    get: vi.fn((name: string) =>
      name === REFRESH_COOKIE_NAME && value ? { value } : undefined,
    ),
  });
}

describe("handleRefreshAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a request without the local refresh cookie", async () => {
    mockRefreshCookie();

    const response = await handleRefreshAuth();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorized",
      message: "Invalid refresh token",
      statusCode: 401,
    });
    expect(postUpstreamAuthMock).not.toHaveBeenCalled();
  });

  it("forwards the cookie and applies a rotated refresh token", async () => {
    mockRefreshCookie("old-token");
    postUpstreamAuthMock.mockResolvedValue({
      json: { accessToken: "new-access-token" },
      upstream: new Response(null, {
        status: 200,
        headers: {
          "set-cookie": `${REFRESH_COOKIE_NAME}=new-token; Path=/; HttpOnly`,
        },
      }),
    });

    const response = await handleRefreshAuth();

    expect(postUpstreamAuthMock).toHaveBeenCalledWith(
      "/auth/refresh",
      JSON.stringify({ refreshToken: "old-token" }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain(
      `${REFRESH_COOKIE_NAME}=new-token`,
    );
  });

  it("preserves a non-401 upstream error without clearing the local cookie", async () => {
    mockRefreshCookie("refresh-token");
    postUpstreamAuthMock.mockResolvedValue({
      json: { message: "Rate limited" },
      upstream: new Response(null, { status: 429 }),
    });

    const response = await handleRefreshAuth();

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({ message: "Rate limited" });
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("clears the local cookie when the upstream rejects it as unauthorized", async () => {
    mockRefreshCookie("expired-token");
    postUpstreamAuthMock.mockResolvedValue({
      json: { message: "Invalid refresh token" },
      upstream: new Response(null, { status: 401 }),
    });

    const response = await handleRefreshAuth();

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
