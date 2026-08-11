import { act, renderHook } from "@testing-library/react";
import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@/entities/auth/types";
import type { AuthStatus } from "@/entities/session";
import { useAuthSessionActions } from "./useAuthSessionActions";

vi.mock("@/entities/session/model/accessTokenManager", () => ({
  clearClientSession: vi.fn(),
  establishSession: vi.fn(),
}));

vi.mock("@/entities/session/model/authenticatedRequest", () => ({
  runAuthenticatedRequest: vi.fn(
    async ({ request }: { request: (token: string) => Promise<AuthUser> }) =>
      request("access-token"),
  ),
}));

vi.mock("@/entities/auth/api/auth", () => ({
  completeEmailOtpProfile: vi.fn(),
  googleLogin: vi.fn(),
  login: vi.fn(),
  logoutSession: vi.fn(),
  register: vi.fn(),
  updateProfile: vi.fn(),
  verifyEmailOtp: vi.fn(),
}));

import {
  clearClientSession,
  establishSession,
} from "@/entities/session/model/accessTokenManager";
import {
  completeEmailOtpProfile,
  googleLogin,
  login,
  logoutSession,
  register,
  updateProfile,
  verifyEmailOtp,
} from "@/entities/auth/api/auth";

const clearClientSessionMock = vi.mocked(clearClientSession);
const establishSessionMock = vi.mocked(establishSession);
const completeEmailOtpProfileMock = vi.mocked(completeEmailOtpProfile);
const googleLoginMock = vi.mocked(googleLogin);
const loginMock = vi.mocked(login);
const logoutSessionMock = vi.mocked(logoutSession);
const registerMock = vi.mocked(register);
const updateProfileMock = vi.mocked(updateProfile);
const verifyEmailOtpMock = vi.mocked(verifyEmailOtp);

const sampleUser: AuthUser = {
  id: "user-1",
  email: "user@example.com",
  name: "User",
  avatarUrl: null,
  role: "USER",
};

function useActionsHarness() {
  const [status, setStatus] = useState<AuthStatus>("guest");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [postMessage] = useState(() => vi.fn());
  const sessionChannelRef = useRef<BroadcastChannel | null>({
    postMessage: (...args: unknown[]) => postMessage(...args),
  } as unknown as BroadcastChannel);

  const actions = useAuthSessionActions({
    sessionChannelRef,
    setStatus: setStatus as Dispatch<SetStateAction<AuthStatus>>,
    setUser: setUser as Dispatch<SetStateAction<AuthUser | null>>,
  });

  return { actions, postMessage, status, user };
}

describe("useAuthSessionActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loginMock.mockResolvedValue({ accessToken: "token", user: sampleUser });
    registerMock.mockResolvedValue({ accessToken: "token", user: sampleUser });
    googleLoginMock.mockResolvedValue({
      accessToken: "token",
      user: sampleUser,
    });
    completeEmailOtpProfileMock.mockResolvedValue({
      accessToken: "token",
      user: sampleUser,
    });
    verifyEmailOtpMock.mockResolvedValue({
      accessToken: "token",
      user: sampleUser,
    });
    logoutSessionMock.mockResolvedValue({ success: true });
    updateProfileMock.mockResolvedValue({ ...sampleUser, name: "Updated" });
  });

  it("establishes a session after password login and notifies other tabs", async () => {
    const { result } = renderHook(() => useActionsHarness());

    await act(async () => {
      await result.current.actions.login({
        email: "user@example.com",
        password: "secret",
      });
    });

    expect(loginMock).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "secret",
    });
    expect(establishSessionMock).toHaveBeenCalledWith({ accessToken: "token" });
    expect(result.current.status).toBe("authenticated");
    expect(result.current.user).toEqual(sampleUser);
    expect(result.current.postMessage).toHaveBeenCalledWith({
      type: "session-changed",
    });
  });

  it("establishes a session after register and google login", async () => {
    const { result } = renderHook(() => useActionsHarness());

    await act(async () => {
      await result.current.actions.register({
        email: "user@example.com",
        password: "secret",
        name: "User",
      });
    });
    expect(registerMock).toHaveBeenCalled();
    expect(result.current.status).toBe("authenticated");

    await act(async () => {
      await result.current.actions.googleLogin({ code: "google-code" });
    });
    expect(googleLoginMock).toHaveBeenCalledWith({ code: "google-code" });
    expect(establishSessionMock).toHaveBeenCalled();
  });

  it("returns profile_required without establishing a session", async () => {
    verifyEmailOtpMock.mockResolvedValue({
      enrollmentToken: "enrollment",
      status: "profile_required",
    });
    const { result } = renderHook(() => useActionsHarness());

    let response: unknown;
    await act(async () => {
      response = await result.current.actions.verifyEmailOtp({
        challengeId: "c1",
        code: "123456",
      });
    });

    expect(response).toEqual({
      enrollmentToken: "enrollment",
      status: "profile_required",
    });
    expect(establishSessionMock).not.toHaveBeenCalled();
    expect(result.current.status).toBe("guest");
  });

  it("establishes a session after verifying an existing account", async () => {
    const { result } = renderHook(() => useActionsHarness());

    await act(async () => {
      await result.current.actions.verifyEmailOtp({
        challengeId: "c1",
        code: "123456",
      });
    });

    expect(establishSessionMock).toHaveBeenCalledWith({ accessToken: "token" });
    expect(result.current.user).toEqual(sampleUser);
  });

  it("completes an email OTP profile and establishes a session", async () => {
    const { result } = renderHook(() => useActionsHarness());

    await act(async () => {
      await result.current.actions.completeEmailOtpProfile({
        enrollmentToken: "enrollment",
        name: "User",
      });
    });

    expect(completeEmailOtpProfileMock).toHaveBeenCalledWith({
      enrollmentToken: "enrollment",
      name: "User",
    });
    expect(result.current.status).toBe("authenticated");
  });

  it("logs out locally even when logout request fails", async () => {
    logoutSessionMock.mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useActionsHarness());

    await act(async () => {
      await result.current.actions.login({
        email: "user@example.com",
        password: "secret",
      });
    });
    await act(async () => {
      await result.current.actions.logout();
    });

    expect(clearClientSessionMock).toHaveBeenCalled();
    expect(result.current.status).toBe("guest");
    expect(result.current.user).toBeNull();
    expect(result.current.postMessage).toHaveBeenCalledWith({
      type: "session-signed-out",
    });
  });

  it("updates the local user after saving a profile", async () => {
    const { result } = renderHook(() => useActionsHarness());

    await act(async () => {
      await result.current.actions.updateProfile({ name: "Updated" });
    });

    expect(updateProfileMock).toHaveBeenCalledWith("access-token", {
      name: "Updated",
    });
    expect(result.current.user).toEqual({ ...sampleUser, name: "Updated" });
    expect(result.current.postMessage).toHaveBeenCalledWith({
      type: "session-changed",
    });
  });
});
