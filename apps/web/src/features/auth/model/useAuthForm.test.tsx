import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/http";
import { LocaleProvider } from "@/shared/providers/LocaleProvider";
import { useAuthForm } from "./useAuthForm";

const mocks = vi.hoisted(() => ({
  completeEmailOtpProfile: vi.fn(),
  googleLogin: vi.fn(),
  replace: vi.fn(),
  requestEmailOtp: vi.fn(),
  verifyEmailOtp: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("@/entities/auth/api/auth", () => ({
  requestEmailOtp: mocks.requestEmailOtp,
}));

vi.mock("./authSessionContext", () => ({
  useAuthSession: () => ({
    completeEmailOtpProfile: mocks.completeEmailOtpProfile,
    googleLogin: mocks.googleLogin,
    verifyEmailOtp: mocks.verifyEmailOtp,
  }),
  useAuthSessionContext: () => ({
    completeEmailOtpProfile: mocks.completeEmailOtpProfile,
    googleLogin: mocks.googleLogin,
    verifyEmailOtp: mocks.verifyEmailOtp,
  }),
}));

const CHALLENGE_ID = "f1bb6a0d-5e47-4a4d-93bf-6d3aebfae35a";

function wrapper({ children }: { children: ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>;
}

function createSubmitEvent() {
  return {
    preventDefault: vi.fn(),
  } as unknown as React.FormEvent<HTMLFormElement>;
}

describe("useAuthForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requestEmailOtp.mockResolvedValue({
      challengeId: CHALLENGE_ID,
      resendAvailableAt: new Date(Date.now() - 1).toISOString(),
    });
    mocks.verifyEmailOtp.mockResolvedValue({ accessToken: "token", user: {} });
    mocks.completeEmailOtpProfile.mockResolvedValue(undefined);
    mocks.googleLogin.mockResolvedValue(undefined);
  });

  it("requests an OTP and moves to the otp step", async () => {
    const { result } = renderHook(() => useAuthForm(), { wrapper });

    act(() => {
      result.current.updateEmail("  linh@example.com ");
    });

    await act(async () => {
      await result.current.handleEmailSubmit(createSubmitEvent());
    });

    expect(mocks.requestEmailOtp).toHaveBeenCalledWith({
      email: "linh@example.com",
    });
    expect(result.current.step).toBe("otp");
    expect(result.current.resendRemainingSeconds).toBe(0);
  });

  it("stores request errors and clears them when the email changes", async () => {
    mocks.requestEmailOtp.mockRejectedValue(new ApiError("Too many requests", 429));
    const { result } = renderHook(() => useAuthForm(), { wrapper });

    act(() => {
      result.current.updateEmail("linh@example.com");
    });
    await act(async () => {
      await result.current.handleEmailSubmit(createSubmitEvent());
    });

    expect(result.current.error).toBe("Too many requests");
    expect(result.current.step).toBe("email");

    act(() => {
      result.current.updateEmail("linh@example.com");
    });
    expect(result.current.error).toBeNull();
  });

  it("falls back when request fails without an API message", async () => {
    mocks.requestEmailOtp.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useAuthForm(), { wrapper });

    act(() => {
      result.current.updateEmail("linh@example.com");
    });
    await act(async () => {
      await result.current.handleEmailSubmit(createSubmitEvent());
    });

    expect(result.current.error).toBe("Cannot connect to server.");
  });

  it("verifies an existing account and redirects", async () => {
    const { result } = renderHook(() => useAuthForm({ redirectTo: "/review" }), {
      wrapper,
    });

    act(() => {
      result.current.updateEmail("linh@example.com");
    });
    await act(async () => {
      await result.current.handleEmailSubmit(createSubmitEvent());
    });
    act(() => {
      result.current.updateCode("123456");
    });
    await act(async () => {
      await result.current.handleOtpSubmit(createSubmitEvent());
    });

    expect(mocks.verifyEmailOtp).toHaveBeenCalledWith({
      challengeId: CHALLENGE_ID,
      code: "123456",
    });
    expect(mocks.replace).toHaveBeenCalledWith("/review");
  });

  it("moves to profile when verification requires enrollment", async () => {
    mocks.verifyEmailOtp.mockResolvedValue({
      enrollmentToken: "enrollment-token",
      status: "profile_required",
    });
    const { result } = renderHook(() => useAuthForm(), { wrapper });

    act(() => {
      result.current.updateEmail("new@example.com");
    });
    await act(async () => {
      await result.current.handleEmailSubmit(createSubmitEvent());
    });
    act(() => {
      result.current.updateCode("123456");
    });
    await act(async () => {
      await result.current.handleOtpSubmit(createSubmitEvent());
    });

    expect(result.current.step).toBe("profile");
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("completes the profile and redirects with a trimmed name", async () => {
    mocks.verifyEmailOtp.mockResolvedValue({
      enrollmentToken: "enrollment-token",
      status: "profile_required",
    });
    const { result } = renderHook(() => useAuthForm({ redirectTo: "/home" }), {
      wrapper,
    });

    act(() => {
      result.current.updateEmail("new@example.com");
    });
    await act(async () => {
      await result.current.handleEmailSubmit(createSubmitEvent());
    });
    act(() => {
      result.current.updateCode("123456");
    });
    await act(async () => {
      await result.current.handleOtpSubmit(createSubmitEvent());
    });
    act(() => {
      result.current.updateName("  Linh  ");
    });
    await act(async () => {
      await result.current.handleProfileSubmit(createSubmitEvent());
    });

    expect(mocks.completeEmailOtpProfile).toHaveBeenCalledWith({
      enrollmentToken: "enrollment-token",
      name: "Linh",
    });
    expect(mocks.replace).toHaveBeenCalledWith("/home");
  });

  it("keeps only digits in the code, max six characters", () => {
    const { result } = renderHook(() => useAuthForm(), { wrapper });

    act(() => {
      result.current.updateCode("12ab34cd5678");
    });

    expect(result.current.code).toBe("123456");
  });

  it("returns to the email step when changing email", async () => {
    const { result } = renderHook(() => useAuthForm(), { wrapper });

    act(() => {
      result.current.updateEmail("linh@example.com");
    });
    await act(async () => {
      await result.current.handleEmailSubmit(createSubmitEvent());
    });
    act(() => {
      result.current.changeEmail();
    });

    expect(result.current.step).toBe("email");
    expect(result.current.code).toBe("");
    expect(result.current.email).toBe("linh@example.com");
  });

  it("resends a code after the cooldown has elapsed", async () => {
    mocks.requestEmailOtp
      .mockResolvedValueOnce({
        challengeId: CHALLENGE_ID,
        resendAvailableAt: new Date(Date.now() - 1).toISOString(),
      })
      .mockResolvedValueOnce({
        challengeId: "second-challenge",
        resendAvailableAt: new Date(Date.now() + 60_000).toISOString(),
      });

    const { result } = renderHook(() => useAuthForm(), { wrapper });

    act(() => {
      result.current.updateEmail("linh@example.com");
    });
    await act(async () => {
      await result.current.handleEmailSubmit(createSubmitEvent());
    });

    await act(async () => {
      result.current.handleResendCode();
    });

    await waitFor(() => {
      expect(mocks.requestEmailOtp).toHaveBeenCalledTimes(2);
    });
    expect(result.current.resendRemainingSeconds).toBeGreaterThan(0);
  });

  it("completes Google sign-in and redirects", async () => {
    const { result } = renderHook(
      () => useAuthForm({ redirectTo: "/collections/user" }),
      { wrapper },
    );

    await act(async () => {
      await result.current.handleGoogleCode("google-auth-code");
    });

    expect(mocks.googleLogin).toHaveBeenCalledWith({ code: "google-auth-code" });
    expect(mocks.replace).toHaveBeenCalledWith("/collections/user");
  });

  it("stores Google button errors", () => {
    const { result } = renderHook(() => useAuthForm(), { wrapper });

    act(() => {
      result.current.handleGoogleError("Google failed");
    });

    expect(result.current.error).toBe("Google failed");
  });

  it("surfaces Google login API failures", async () => {
    mocks.googleLogin.mockRejectedValue(new ApiError("Not allowed", 403));
    const { result } = renderHook(() => useAuthForm(), { wrapper });

    await act(async () => {
      await result.current.handleGoogleCode("google-auth-code");
    });

    expect(result.current.error).toBe("Not allowed");
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
