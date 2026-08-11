import { act, renderHook } from "@testing-library/react";
import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/http";
import type { AuthUser } from "@/entities/auth/types";
import type { AuthStatus } from "../lib/authStatus";
import { useAuthSessionBootstrap } from "./useAuthSessionBootstrap";

const channelMocks = vi.hoisted(() => ({
  addEventListener: vi.fn(),
  close: vi.fn(),
  createAuthSessionChannel: vi.fn(),
  removeEventListener: vi.fn(),
}));

vi.mock("@/entities/session/model/accessTokenManager", () => ({
  bootstrapClientSession: vi.fn(),
  clearClientSession: vi.fn(),
  discardClientAccessToken: vi.fn(),
  setSessionInvalidHandler: vi.fn(),
}));

vi.mock("../lib/authSessionChannel", () => ({
  createAuthSessionChannel: channelMocks.createAuthSessionChannel,
  isAuthSessionMessage: (value: unknown) =>
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value.type === "session-changed" || value.type === "session-signed-out"),
}));

import {
  bootstrapClientSession,
  clearClientSession,
  discardClientAccessToken,
  setSessionInvalidHandler,
} from "@/entities/session/model/accessTokenManager";

const bootstrapClientSessionMock = vi.mocked(bootstrapClientSession);
const clearClientSessionMock = vi.mocked(clearClientSession);
const discardClientAccessTokenMock = vi.mocked(discardClientAccessToken);
const setSessionInvalidHandlerMock = vi.mocked(setSessionInvalidHandler);

const sampleUser: AuthUser = {
  id: "user-1",
  email: "user@example.com",
  name: "User",
  avatarUrl: null,
  role: "USER",
};

function useBootstrapHarness() {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const sessionChannelRef = useRef<BroadcastChannel | null>(null);

  useAuthSessionBootstrap({
    sessionChannelRef,
    setStatus: setStatus as Dispatch<SetStateAction<AuthStatus>>,
    setUser: setUser as Dispatch<SetStateAction<AuthUser | null>>,
  });

  return { sessionChannelRef, status, user };
}

describe("useAuthSessionBootstrap", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    channelMocks.addEventListener.mockReset();
    channelMocks.close.mockReset();
    channelMocks.removeEventListener.mockReset();
    channelMocks.createAuthSessionChannel.mockReturnValue({
      addEventListener: channelMocks.addEventListener,
      close: channelMocks.close,
      removeEventListener: channelMocks.removeEventListener,
    });
    bootstrapClientSessionMock.mockResolvedValue({
      accessToken: "token",
      user: sampleUser,
    });

    // Mirror production: clearClientSession notifies the invalid-session handler.
    let sessionInvalidHandler: (() => void) | null = null;
    setSessionInvalidHandlerMock.mockImplementation((handler) => {
      sessionInvalidHandler = handler;
    });
    clearClientSessionMock.mockImplementation(() => {
      sessionInvalidHandler?.();
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("bootstraps an authenticated session", async () => {
    const { result } = renderHook(() => useBootstrapHarness());

    await act(async () => {
      await Promise.resolve();
    });

    expect(bootstrapClientSessionMock).toHaveBeenCalled();
    expect(result.current.status).toBe("authenticated");
    expect(result.current.user).toEqual(sampleUser);
    expect(result.current.sessionChannelRef.current).not.toBeNull();
  });

  it("retries a temporary bootstrap failure without treating the user as a guest", async () => {
    bootstrapClientSessionMock
      .mockRejectedValueOnce(new ApiError("Server unavailable", 503))
      .mockResolvedValueOnce({
        accessToken: "token",
        user: sampleUser,
      });

    const { result } = renderHook(() => useBootstrapHarness());

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.status).toBe("loading");
    expect(clearClientSessionMock).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(result.current.status).toBe("authenticated");
    expect(result.current.user).toEqual(sampleUser);
  });

  it("clears the session when bootstrap is unauthorized", async () => {
    bootstrapClientSessionMock.mockRejectedValue(
      new ApiError("Unauthorized", 401),
    );

    const { result } = renderHook(() => useBootstrapHarness());

    await act(async () => {
      await Promise.resolve();
    });

    expect(clearClientSessionMock).toHaveBeenCalled();
    expect(result.current.status).toBe("guest");
    expect(result.current.user).toBeNull();
  });

  it("re-bootstraps when another tab reports a session change", async () => {
    bootstrapClientSessionMock
      .mockResolvedValueOnce({
        accessToken: "token-a",
        user: { ...sampleUser, id: "user-a", email: "a@example.com" },
      })
      .mockResolvedValueOnce({
        accessToken: "token-b",
        user: { ...sampleUser, id: "user-b", email: "b@example.com" },
      });

    const { result } = renderHook(() => useBootstrapHarness());

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.user?.id).toBe("user-a");

    const handleMessage = channelMocks.addEventListener.mock.calls[0]?.[1] as (
      event: MessageEvent<unknown>,
    ) => void;

    await act(async () => {
      handleMessage({ data: { type: "session-changed" } } as MessageEvent);
      await Promise.resolve();
    });

    expect(discardClientAccessTokenMock).toHaveBeenCalled();
    expect(result.current.user?.id).toBe("user-b");
  });

  it("signs out locally when another tab reports signed out", async () => {
    const { result } = renderHook(() => useBootstrapHarness());

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.status).toBe("authenticated");

    const handleMessage = channelMocks.addEventListener.mock.calls[0]?.[1] as (
      event: MessageEvent<unknown>,
    ) => void;

    await act(async () => {
      handleMessage({ data: { type: "session-signed-out" } } as MessageEvent);
    });

    expect(discardClientAccessTokenMock).toHaveBeenCalled();
    expect(result.current.status).toBe("guest");
    expect(result.current.user).toBeNull();
  });

  it("ignores malformed broadcast messages", async () => {
    const { result } = renderHook(() => useBootstrapHarness());

    await act(async () => {
      await Promise.resolve();
    });

    const handleMessage = channelMocks.addEventListener.mock.calls[0]?.[1] as (
      event: MessageEvent<unknown>,
    ) => void;

    await act(async () => {
      handleMessage({ data: { type: "unknown" } } as MessageEvent);
      handleMessage({ data: null } as MessageEvent);
    });

    expect(discardClientAccessTokenMock).not.toHaveBeenCalled();
    expect(result.current.status).toBe("authenticated");
  });
});
