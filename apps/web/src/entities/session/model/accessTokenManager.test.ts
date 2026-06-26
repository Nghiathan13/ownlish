import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/entities/session/api/refreshSession", () => ({
  refreshSession: vi.fn(),
}));

vi.mock("@/shared/api/http", () => {
  class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  }

  return {
    ApiError,
    isUnauthorizedError: (error: unknown) =>
      error instanceof ApiError && error.status === 401,
  };
});

import { ApiError } from "@/shared/api/http";
import { refreshSession } from "@/entities/session/api/refreshSession";
import {
  clearStoredAccessToken,
  getStoredAccessToken,
  setStoredAccessToken,
} from "./accessTokenStore";
import {
  bootstrapClientSession,
  clearClientSession,
  establishSession,
  getValidAccessToken,
  setSessionInvalidHandler,
} from "./accessTokenManager";

const refreshSessionMock = vi.mocked(refreshSession);

function createTestToken(exp: number): string {
  const encode = (value: string) =>
    btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const header = encode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = encode(
    JSON.stringify({ sub: "user-1", email: "user@example.com", exp }),
  );

  return `${header}.${payload}.signature`;
}

describe("accessTokenManager", () => {
  beforeEach(() => {
    clearStoredAccessToken();
    setSessionInvalidHandler(null);
    refreshSessionMock.mockReset();
  });

  it("stores access token on establishSession", () => {
    establishSession({ accessToken: "token-1" });

    expect(getStoredAccessToken()).toBe("token-1");
  });

  it("returns a valid stored token without refreshing", async () => {
    const token = createTestToken(Math.floor(Date.now() / 1000) + 3600);
    establishSession({ accessToken: token });

    await expect(getValidAccessToken()).resolves.toBe(token);
    expect(refreshSessionMock).not.toHaveBeenCalled();
  });

  it("refreshes when the stored token is expired", async () => {
    const expiredToken = createTestToken(Math.floor(Date.now() / 1000) - 120);
    const freshToken = createTestToken(Math.floor(Date.now() / 1000) + 3600);

    setStoredAccessToken(expiredToken);
    refreshSessionMock.mockResolvedValue({
      accessToken: freshToken,
      user: { id: "user-1", email: "user@example.com", name: null, role: "USER" },
    });

    await expect(getValidAccessToken()).resolves.toBe(freshToken);
    expect(refreshSessionMock).toHaveBeenCalledTimes(1);
    expect(getStoredAccessToken()).toBe(freshToken);
  });

  it("dedupes concurrent refresh requests", async () => {
    const expiredToken = createTestToken(Math.floor(Date.now() / 1000) - 120);
    const freshToken = createTestToken(Math.floor(Date.now() / 1000) + 3600);

    setStoredAccessToken(expiredToken);
    refreshSessionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              accessToken: freshToken,
              user: { id: "user-1", email: "user@example.com", name: null, role: "USER" },
            });
          }, 20);
        }),
    );

    const [first, second] = await Promise.all([
      getValidAccessToken(),
      getValidAccessToken(),
    ]);

    expect(first).toBe(freshToken);
    expect(second).toBe(freshToken);
    expect(refreshSessionMock).toHaveBeenCalledTimes(1);
  });

  it("clears session and notifies handler when refresh returns 401", async () => {
    const handler = vi.fn();
    setSessionInvalidHandler(handler);
    setStoredAccessToken(createTestToken(Math.floor(Date.now() / 1000) - 120));
    refreshSessionMock.mockRejectedValue(new ApiError("Unauthorized", 401));

    await expect(getValidAccessToken()).rejects.toBeInstanceOf(ApiError);
    expect(getStoredAccessToken()).toBeNull();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("bootstrapClientSession returns refreshed session", async () => {
    const freshToken = createTestToken(Math.floor(Date.now() / 1000) + 3600);
    const session = {
      accessToken: freshToken,
      user: { id: "user-1", email: "user@example.com", name: null, role: "USER" },
    };

    refreshSessionMock.mockResolvedValue(session);

    await expect(bootstrapClientSession()).resolves.toEqual(session);
    expect(getStoredAccessToken()).toBe(freshToken);
    expect(refreshSessionMock).toHaveBeenCalledTimes(1);
  });

  it("clears session through clearClientSession", () => {
    const handler = vi.fn();
    setSessionInvalidHandler(handler);
    establishSession({ accessToken: "token-1" });

    clearClientSession();

    expect(getStoredAccessToken()).toBeNull();
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
