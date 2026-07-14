import { beforeEach, describe, expect, it, vi } from "vitest";
import { REFRESH_COOKIE_NAME } from "@/server/auth/constants";

const { cookiesMock, postUpstreamAuthMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  postUpstreamAuthMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/server/auth/upstreamAuth", () => ({
  postUpstreamAuth: postUpstreamAuthMock,
}));

import { handleLogoutAuth } from "@/server/auth/handleLogoutAuth";

function mockRefreshCookie(value?: string): void {
  cookiesMock.mockResolvedValue({
    get: vi.fn((name: string) =>
      name === REFRESH_COOKIE_NAME && value ? { value } : undefined,
    ),
  });
}

function expectRefreshCookieCleared(response: Response): void {
  const setCookie = response.headers.get("set-cookie");

  expect(setCookie).toContain(`${REFRESH_COOKIE_NAME}=`);
  expect(setCookie).toContain("Path=/api/auth");
  expect(setCookie).toContain("Max-Age=0");
}

describe("handleLogoutAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forwards the refresh token and preserves a successful upstream response", async () => {
    mockRefreshCookie("refresh-secret");
    postUpstreamAuthMock.mockResolvedValue({
      json: { success: true },
      upstream: new Response(null, { status: 201 }),
    });

    const response = await handleLogoutAuth();

    expect(postUpstreamAuthMock).toHaveBeenCalledWith(
      "/auth/logout",
      JSON.stringify({ refreshToken: "refresh-secret" }),
    );
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ success: true });
    expectRefreshCookieCleared(response);
  });

  it("sends an empty payload without a refresh cookie", async () => {
    mockRefreshCookie();
    postUpstreamAuthMock.mockResolvedValue({
      json: { success: true },
      upstream: new Response(null, { status: 200 }),
    });

    const response = await handleLogoutAuth();

    expect(postUpstreamAuthMock).toHaveBeenCalledWith(
      "/auth/logout",
      JSON.stringify({}),
    );
    expectRefreshCookieCleared(response);
  });

  it("preserves an upstream HTTP error response and clears the cookie", async () => {
    mockRefreshCookie("refresh-secret");
    const body = {
      error: "Unauthorized",
      message: "Invalid refresh token",
      statusCode: 401,
    };
    postUpstreamAuthMock.mockResolvedValue({
      json: body,
      upstream: new Response(null, { status: 401 }),
    });

    const response = await handleLogoutAuth();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual(body);
    expectRefreshCookieCleared(response);
  });

  it("returns a stable 502 response and clears the cookie when upstream is unreachable", async () => {
    mockRefreshCookie("refresh-secret");
    postUpstreamAuthMock.mockRejectedValue(
      new Error("connect ECONNREFUSED refresh-secret"),
    );

    const response = await handleLogoutAuth();

    expect(response.status).toBe(502);
    const responseBody = await response.json();

    expect(responseBody).toEqual({
      error: "Bad Gateway",
      message: "Authentication service unavailable",
      statusCode: 502,
    });
    expect(JSON.stringify(responseBody)).not.toContain("refresh-secret");
    expect(JSON.stringify(responseBody)).not.toContain("ECONNREFUSED");
    expectRefreshCookieCleared(response);
  });
});
