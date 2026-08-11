import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api";

vi.mock("@/entities/session", () => ({
  bootstrapClientSession: vi.fn(),
  clearClientSession: vi.fn(),
  discardClientAccessToken: vi.fn(),
  establishSession: vi.fn(),
  getValidAccessToken: vi.fn(),
  setSessionInvalidHandler: vi.fn(),
}));

vi.mock("@/entities/auth", () => ({
  completeEmailOtpProfile: vi.fn(),
  googleLogin: vi.fn(),
  login: vi.fn(),
  logoutSession: vi.fn(),
  register: vi.fn(),
  updateProfile: vi.fn(),
  verifyEmailOtp: vi.fn(),
}));

import {
  bootstrapClientSession,
  clearClientSession,
  discardClientAccessToken,
  establishSession,
  getValidAccessToken,
  setSessionInvalidHandler,
} from "@/entities/session";
import {
  completeEmailOtpProfile,
  googleLogin,
  login,
  logoutSession,
  register,
  updateProfile,
  verifyEmailOtp,
} from "@/entities/auth";
import { AuthProvider } from "./AuthProvider";
import { useAuthSessionContext } from "@/entities/session";

const bootstrapClientSessionMock = vi.mocked(bootstrapClientSession);
const clearClientSessionMock = vi.mocked(clearClientSession);
const discardClientAccessTokenMock = vi.mocked(discardClientAccessToken);
const establishSessionMock = vi.mocked(establishSession);
const getValidAccessTokenMock = vi.mocked(getValidAccessToken);
const setSessionInvalidHandlerMock = vi.mocked(setSessionInvalidHandler);
const completeEmailOtpProfileMock = vi.mocked(completeEmailOtpProfile);
const googleLoginMock = vi.mocked(googleLogin);
const loginMock = vi.mocked(login);
const logoutSessionMock = vi.mocked(logoutSession);
const registerMock = vi.mocked(register);
const updateProfileMock = vi.mocked(updateProfile);
const verifyEmailOtpMock = vi.mocked(verifyEmailOtp);

const existingUser = {
  id: "user-existing",
  email: "existing@example.com",
  name: "Existing User",
  avatarUrl: null,
  role: "USER" as const,
};

const enrolledUser = {
  id: "user-new",
  email: "new@example.com",
  name: "New User",
  avatarUrl: null,
  role: "USER" as const,
};

function AuthStatus() {
  const {
    completeEmailOtpProfile,
    googleLogin,
    login,
    logout,
    register,
    status,
    updateProfile,
    user,
    verifyEmailOtp,
  } = useAuthSessionContext();

  return (
    <>
      <p>{`${status}:${user?.id ?? "none"}`}</p>
      <p>{user?.name ?? "No name"}</p>
      <button type="button" onClick={() => void logout()}>
        Logout
      </button>
      <button
        type="button"
        onClick={() => void updateProfile({ name: "Updated User" })}
      >
        Update profile
      </button>
      <button
        type="button"
        onClick={() =>
          void login({ email: "legacy@example.com", password: "secret" })
        }
      >
        Password login
      </button>
      <button
        type="button"
        onClick={() =>
          void register({
            email: "register@example.com",
            password: "secret",
            name: "Registered User",
          })
        }
      >
        Password register
      </button>
      <button
        type="button"
        onClick={() =>
          void verifyEmailOtp({
            challengeId: "challenge-id",
            code: "123456",
          }).then((result) => {
            if ("status" in result) {
              document.body.dataset.otpResult = result.status;
              return;
            }

            document.body.dataset.otpResult = result.user.id;
          })
        }
      >
        Verify email OTP
      </button>
      <button
        type="button"
        onClick={() =>
          void completeEmailOtpProfile({
            enrollmentToken: "enrollment-token",
            name: "New User",
          })
        }
      >
        Complete email OTP profile
      </button>
      <button
        type="button"
        onClick={() => void googleLogin({ code: "google-auth-code" })}
      >
        Google login
      </button>
    </>
  );
}

async function renderAuthenticatedProvider() {
  bootstrapClientSessionMock.mockRejectedValue(new ApiError("Unauthorized", 401));

  render(
    <AuthProvider>
      <AuthStatus />
    </AuthProvider>,
  );

  await act(async () => {
    await Promise.resolve();
  });

  expect(screen.getByText("guest:none")).toBeInTheDocument();
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
    delete document.body.dataset.otpResult;
    bootstrapClientSessionMock.mockReset();
    clearClientSessionMock.mockReset();
    discardClientAccessTokenMock.mockReset();
    establishSessionMock.mockReset();
    getValidAccessTokenMock.mockReset();
    completeEmailOtpProfileMock.mockReset();
    googleLoginMock.mockReset();
    loginMock.mockReset();
    logoutSessionMock.mockReset();
    registerMock.mockReset();
    updateProfileMock.mockReset();
    verifyEmailOtpMock.mockReset();
    setSessionInvalidHandlerMock.mockReset();

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

    const otherTabChannel = new BroadcastChannelMock("ownlish-auth");
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

    const otherTabChannel = new BroadcastChannelMock("ownlish-auth");
    await act(async () => {
      otherTabChannel.postMessage({ type: "session-signed-out" });
    });

    expect(discardClientAccessTokenMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("guest:none")).toBeInTheDocument();
  });

  it("ignores malformed auth broadcast messages from other tabs", async () => {
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

    expect(screen.getByText("authenticated:user-a")).toBeInTheDocument();

    const otherTabChannel = new BroadcastChannelMock("ownlish-auth");
    await act(async () => {
      otherTabChannel.postMessage({ type: "session-refreshed" });
      otherTabChannel.postMessage(null);
      otherTabChannel.postMessage("session-changed");
      await Promise.resolve();
    });

    expect(discardClientAccessTokenMock).not.toHaveBeenCalled();
    expect(bootstrapClientSessionMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("authenticated:user-a")).toBeInTheDocument();
  });

  it("bootstraps when BroadcastChannel is unavailable", async () => {
    vi.stubGlobal("BroadcastChannel", undefined);
    bootstrapClientSessionMock.mockResolvedValue({
      accessToken: "access-token",
      user: {
        id: "user-id",
        email: "user@example.com",
        name: "Solo Tab",
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
    expect(screen.getByText("authenticated:user-id")).toBeInTheDocument();
    expect(screen.getByText("Solo Tab")).toBeInTheDocument();
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

  it("updates the local user and synchronizes the other tabs after saving a profile", async () => {
    bootstrapClientSessionMock.mockResolvedValue({
      accessToken: "access-token-a",
      user: {
        id: "user-a",
        email: "a@example.com",
        name: "Original User",
        avatarUrl: null,
        role: "USER",
      },
    });
    updateProfileMock.mockResolvedValue({
      id: "user-a",
      email: "a@example.com",
      name: "Updated User",
      avatarUrl: "https://example.com/avatar.png",
      role: "USER",
    });
    getValidAccessTokenMock.mockResolvedValue("access-token-a");

    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    );

    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.click(screen.getByRole("button", { name: "Update profile" }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(updateProfileMock).toHaveBeenCalledWith("access-token-a", {
      name: "Updated User",
    });
    expect(screen.getByText("Updated User")).toBeInTheDocument();
  });

  it("establishes a session after verifying an email OTP for an existing account", async () => {
    verifyEmailOtpMock.mockResolvedValue({
      accessToken: "otp-access-token",
      user: existingUser,
    });

    await renderAuthenticatedProvider();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Verify email OTP" }));
      await Promise.resolve();
    });

    expect(verifyEmailOtpMock).toHaveBeenCalledWith({
      challengeId: "challenge-id",
      code: "123456",
    });
    expect(establishSessionMock).toHaveBeenCalledWith({
      accessToken: "otp-access-token",
    });
    expect(screen.getByText("authenticated:user-existing")).toBeInTheDocument();
    expect(screen.getByText("Existing User")).toBeInTheDocument();
    expect(document.body.dataset.otpResult).toBe("user-existing");
  });

  it("returns a profile enrollment challenge without establishing a session", async () => {
    verifyEmailOtpMock.mockResolvedValue({
      enrollmentToken: "enrollment-token",
      status: "profile_required",
    });

    await renderAuthenticatedProvider();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Verify email OTP" }));
      await Promise.resolve();
    });

    expect(verifyEmailOtpMock).toHaveBeenCalledWith({
      challengeId: "challenge-id",
      code: "123456",
    });
    expect(establishSessionMock).not.toHaveBeenCalled();
    expect(screen.getByText("guest:none")).toBeInTheDocument();
    expect(document.body.dataset.otpResult).toBe("profile_required");
  });

  it("establishes a session after completing the email OTP profile", async () => {
    completeEmailOtpProfileMock.mockResolvedValue({
      accessToken: "profile-access-token",
      user: enrolledUser,
    });

    await renderAuthenticatedProvider();

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Complete email OTP profile" }),
      );
      await Promise.resolve();
    });

    expect(completeEmailOtpProfileMock).toHaveBeenCalledWith({
      enrollmentToken: "enrollment-token",
      name: "New User",
    });
    expect(establishSessionMock).toHaveBeenCalledWith({
      accessToken: "profile-access-token",
    });
    expect(screen.getByText("authenticated:user-new")).toBeInTheDocument();
    expect(screen.getByText("New User")).toBeInTheDocument();
  });

  it("establishes a session after Google sign-in", async () => {
    googleLoginMock.mockResolvedValue({
      accessToken: "google-access-token",
      user: {
        id: "user-google",
        email: "google@example.com",
        name: "Google User",
        avatarUrl: "https://example.com/google.png",
        role: "USER",
      },
    });

    await renderAuthenticatedProvider();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Google login" }));
      await Promise.resolve();
    });

    expect(googleLoginMock).toHaveBeenCalledWith({ code: "google-auth-code" });
    expect(establishSessionMock).toHaveBeenCalledWith({
      accessToken: "google-access-token",
    });
    expect(screen.getByText("authenticated:user-google")).toBeInTheDocument();
    expect(screen.getByText("Google User")).toBeInTheDocument();
  });

  it("establishes a session after password login", async () => {
    loginMock.mockResolvedValue({
      accessToken: "password-access-token",
      user: {
        id: "user-password",
        email: "legacy@example.com",
        name: "Legacy User",
        avatarUrl: null,
        role: "USER",
      },
    });

    await renderAuthenticatedProvider();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Password login" }));
      await Promise.resolve();
    });

    expect(loginMock).toHaveBeenCalledWith({
      email: "legacy@example.com",
      password: "secret",
    });
    expect(establishSessionMock).toHaveBeenCalledWith({
      accessToken: "password-access-token",
    });
    expect(screen.getByText("authenticated:user-password")).toBeInTheDocument();
  });

  it("establishes a session after password register", async () => {
    registerMock.mockResolvedValue({
      accessToken: "register-access-token",
      user: {
        id: "user-register",
        email: "register@example.com",
        name: "Registered User",
        avatarUrl: null,
        role: "USER",
      },
    });

    await renderAuthenticatedProvider();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Password register" }));
      await Promise.resolve();
    });

    expect(registerMock).toHaveBeenCalledWith({
      email: "register@example.com",
      password: "secret",
      name: "Registered User",
    });
    expect(establishSessionMock).toHaveBeenCalledWith({
      accessToken: "register-access-token",
    });
    expect(screen.getByText("authenticated:user-register")).toBeInTheDocument();
    expect(screen.getByText("Registered User")).toBeInTheDocument();
  });

  it("throws when the auth session hook is used outside AuthProvider", () => {
    expect(() => render(<AuthStatus />)).toThrow(
      "useAuthSession must be used within AuthProvider.",
    );
  });
});
