import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/http";

vi.mock("@/entities/session/model/accessTokenManager", () => ({
  bootstrapClientSession: vi.fn(),
  clearClientSession: vi.fn(),
  discardClientAccessToken: vi.fn(),
  establishSession: vi.fn(),
  setSessionInvalidHandler: vi.fn(),
}));

vi.mock("@/entities/auth/api/auth", () => ({
  googleLogin: vi.fn(),
  login: vi.fn(),
  logoutSession: vi.fn(),
  register: vi.fn(),
}));

import {
  bootstrapClientSession,
  clearClientSession,
  discardClientAccessToken,
  setSessionInvalidHandler,
} from "@/entities/session/model/accessTokenManager";
import { logoutSession } from "@/entities/auth/api/auth";
import {
  AuthProvider,
  useAuthSessionContext,
} from "@/features/auth/providers/AuthProvider";

const bootstrapClientSessionMock = vi.mocked(bootstrapClientSession);
const clearClientSessionMock = vi.mocked(clearClientSession);
const discardClientAccessTokenMock = vi.mocked(discardClientAccessToken);
const setSessionInvalidHandlerMock = vi.mocked(setSessionInvalidHandler);
const logoutSessionMock = vi.mocked(logoutSession);

function AuthStatus() {
  const { logout, status, user } = useAuthSessionContext();

  return (
    <>
      <p>{`${status}:${user?.id ?? "none"}`}</p>
      <button type="button" onClick={() => void logout()}>
        Logout
      </button>
    </>
  );
}

type MessageListener = (event: MessageEvent<unknown>) => void;

class BroadcastChannelMock {
  static channels: BroadcastChannelMock[] = [];

  private readonly listeners = new Set<MessageListener>();

  constructor(private readonly name: string) {
    BroadcastChannelMock.channels.push(this);
  }

  postMessage(message: unknown) {
    for (const channel of BroadcastChannelMock.channels) {
      if (channel !== this && channel.name === this.name) {
        channel.emit(message);
      }
    }
  }

  addEventListener(_: "message", listener: MessageListener) {
    this.listeners.add(listener);
  }

  removeEventListener(_: "message", listener: MessageListener) {
    this.listeners.delete(listener);
  }

  close() {
    BroadcastChannelMock.channels = BroadcastChannelMock.channels.filter(
      (channel) => channel !== this,
    );
  }

  private emit(message: unknown) {
    for (const listener of this.listeners) {
      listener(new MessageEvent("message", { data: message }));
    }
  }
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    BroadcastChannelMock.channels = [];
    vi.stubGlobal("BroadcastChannel", BroadcastChannelMock);
    bootstrapClientSessionMock.mockReset();
    clearClientSessionMock.mockReset();
    discardClientAccessTokenMock.mockReset();
    logoutSessionMock.mockReset();
    setSessionInvalidHandlerMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("retries a temporary bootstrap failure without treating the user as a guest", async () => {
    bootstrapClientSessionMock
      .mockRejectedValueOnce(new ApiError("Server unavailable", 503))
      .mockResolvedValueOnce({
        accessToken: "access-token",
        user: {
          id: "user-id",
          email: "user@example.com",
          name: null,
          avatarUrl: null,
          role: "USER",
        },
      });

    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(bootstrapClientSessionMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("loading:none")).toBeInTheDocument();
    expect(clearClientSessionMock).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(screen.getByText("authenticated:user-id")).toBeInTheDocument();
  });

  it("synchronizes with the current cookie after another tab changes session", async () => {
    bootstrapClientSessionMock
      .mockResolvedValueOnce({
        accessToken: "access-token-a",
        user: {
          id: "user-a",
          email: "a@example.com",
          name: null,
          avatarUrl: null,
          role: "USER",
        },
      })
      .mockResolvedValueOnce({
        accessToken: "access-token-b",
        user: {
          id: "user-b",
          email: "b@example.com",
          name: null,
          avatarUrl: null,
          role: "USER",
        },
      });

    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText("authenticated:user-a")).toBeInTheDocument();

    const otherTabChannel = new BroadcastChannelMock("engvocab-auth");
    await act(async () => {
      otherTabChannel.postMessage({ type: "session-changed" });
      await Promise.resolve();
    });

    expect(discardClientAccessTokenMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("authenticated:user-b")).toBeInTheDocument();
  });

  it("clears local session state when another tab signs out", async () => {
    bootstrapClientSessionMock.mockResolvedValue({
      accessToken: "access-token-a",
      user: {
        id: "user-a",
        email: "a@example.com",
        name: null,
        avatarUrl: null,
        role: "USER",
      },
    });

    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    );

    await act(async () => {
      await Promise.resolve();
    });

    const otherTabChannel = new BroadcastChannelMock("engvocab-auth");
    await act(async () => {
      otherTabChannel.postMessage({ type: "session-signed-out" });
    });

    expect(discardClientAccessTokenMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("guest:none")).toBeInTheDocument();
  });

  it("signs out locally before the logout request finishes", async () => {
    bootstrapClientSessionMock.mockResolvedValue({
      accessToken: "access-token-a",
      user: {
        id: "user-a",
        email: "a@example.com",
        name: null,
        avatarUrl: null,
        role: "USER",
      },
    });
    logoutSessionMock.mockReturnValue(new Promise(() => undefined));

    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    );

    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(clearClientSessionMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("guest:none")).toBeInTheDocument();
  });
});
