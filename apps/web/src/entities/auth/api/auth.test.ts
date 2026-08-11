import { beforeEach, describe, expect, it, vi } from "vitest";

const apiFormRequest = vi.hoisted(() => vi.fn());
const apiRequest = vi.hoisted(() => vi.fn());
const invalidApiResponse = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("invalid");
  }),
);

vi.mock("@/shared/api/http", () => ({
  apiFormRequest,
  apiRequest,
  invalidApiResponse,
}));

import {
  completeEmailOtpProfile,
  getCurrentUser,
  googleLogin,
  login,
  logoutSession,
  register,
  requestEmailOtp,
  updateProfile,
  verifyEmailOtp,
} from "./auth";

const authUser = {
  id: "user-1",
  email: "user@example.com",
  name: "User",
  avatarUrl: null,
  role: "USER",
};

const authResponse = {
  accessToken: "access-token",
  user: authUser,
};

describe("auth API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    invalidApiResponse.mockImplementation(() => {
      throw new Error("invalid");
    });
  });

  it("posts password login and register to the same-origin BFF", async () => {
    apiRequest
      .mockResolvedValueOnce(authResponse)
      .mockResolvedValueOnce(authResponse);

    await expect(
      login({ email: "user@example.com", password: "secret" }),
    ).resolves.toEqual(authResponse);
    expect(apiRequest).toHaveBeenNthCalledWith(1, "/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "user@example.com", password: "secret" }),
      sameOrigin: true,
    });

    await expect(
      register({
        email: "user@example.com",
        password: "secret",
        name: "User",
      }),
    ).resolves.toEqual(authResponse);
    expect(apiRequest).toHaveBeenNthCalledWith(2, "/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "user@example.com",
        password: "secret",
        name: "User",
      }),
      sameOrigin: true,
    });
  });

  it("posts Google login with the CSRF-ish requested-with header", async () => {
    apiRequest.mockResolvedValue(authResponse);

    await expect(googleLogin({ code: "google-auth-code" })).resolves.toEqual(
      authResponse,
    );
    expect(apiRequest).toHaveBeenCalledWith("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ code: "google-auth-code" }),
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
      sameOrigin: true,
    });
  });

  it("parses an email OTP request response", async () => {
    apiRequest.mockResolvedValue({
      challengeId: "challenge-id",
      resendAvailableAt: "2026-08-10T12:00:00.000Z",
    });

    await expect(
      requestEmailOtp({ email: "user@example.com" }),
    ).resolves.toEqual({
      challengeId: "challenge-id",
      resendAvailableAt: "2026-08-10T12:00:00.000Z",
    });
    expect(apiRequest).toHaveBeenCalledWith("/api/auth/email-otp/request", {
      method: "POST",
      body: JSON.stringify({ email: "user@example.com" }),
      sameOrigin: true,
    });
  });

  it("rejects a malformed email OTP request response", async () => {
    apiRequest.mockResolvedValue({ challengeId: 1, resendAvailableAt: null });

    await expect(
      requestEmailOtp({ email: "user@example.com" }),
    ).rejects.toThrow("invalid");
    expect(invalidApiResponse).toHaveBeenCalled();
  });

  it("parses email OTP verification for an existing account", async () => {
    apiRequest.mockResolvedValue(authResponse);

    await expect(
      verifyEmailOtp({ challengeId: "challenge-id", code: "123456" }),
    ).resolves.toEqual(authResponse);
    expect(apiRequest).toHaveBeenCalledWith("/api/auth/email-otp/verify", {
      method: "POST",
      body: JSON.stringify({ challengeId: "challenge-id", code: "123456" }),
      sameOrigin: true,
    });
  });

  it("parses email OTP verification when a profile is still required", async () => {
    apiRequest.mockResolvedValue({
      enrollmentToken: "enrollment-token",
      status: "profile_required",
    });

    await expect(
      verifyEmailOtp({ challengeId: "challenge-id", code: "123456" }),
    ).resolves.toEqual({
      enrollmentToken: "enrollment-token",
      status: "profile_required",
    });
  });

  it("rejects email OTP verification that is neither auth nor profile_required", async () => {
    apiRequest.mockResolvedValue({ status: "profile_required" });

    await expect(
      verifyEmailOtp({ challengeId: "challenge-id", code: "123456" }),
    ).rejects.toThrow("invalid");
    expect(invalidApiResponse).toHaveBeenCalled();
  });

  it("completes the email OTP profile through the BFF", async () => {
    apiRequest.mockResolvedValue(authResponse);

    await expect(
      completeEmailOtpProfile({
        enrollmentToken: "enrollment-token",
        name: "New User",
      }),
    ).resolves.toEqual(authResponse);
    expect(apiRequest).toHaveBeenCalledWith(
      "/api/auth/email-otp/complete-profile",
      {
        method: "POST",
        body: JSON.stringify({
          enrollmentToken: "enrollment-token",
          name: "New User",
        }),
        sameOrigin: true,
      },
    );
  });

  it("loads the current user with a bearer token", async () => {
    apiRequest.mockResolvedValue(authUser);

    await expect(getCurrentUser("access-token")).resolves.toEqual(authUser);
    expect(apiRequest).toHaveBeenCalledWith("/auth/me", {
      token: "access-token",
    });
  });

  it("parses a successful logout response", async () => {
    apiRequest.mockResolvedValue({ success: true });

    await expect(logoutSession()).resolves.toEqual({ success: true });
    expect(apiRequest).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
      sameOrigin: true,
    });
  });

  it("rejects a logout response without success", async () => {
    apiRequest.mockResolvedValue({ success: false });

    await expect(logoutSession()).rejects.toThrow("invalid");
    expect(invalidApiResponse).toHaveBeenCalled();
  });

  it("updates the profile with optional avatar form data", async () => {
    const avatar = new File(["avatar"], "avatar.png", { type: "image/png" });
    apiFormRequest.mockResolvedValue({
      ...authUser,
      name: "Updated User",
      avatarUrl: "https://example.com/avatar.png",
    });

    await expect(
      updateProfile("access-token", { name: "Updated User", avatar }),
    ).resolves.toEqual({
      ...authUser,
      name: "Updated User",
      avatarUrl: "https://example.com/avatar.png",
    });

    expect(apiFormRequest).toHaveBeenCalledWith(
      "/auth/profile",
      expect.objectContaining({
        token: "access-token",
        method: "PATCH",
        body: expect.any(FormData),
      }),
    );

    const body = apiFormRequest.mock.calls[0]?.[1]?.body as FormData;
    expect(body.get("name")).toBe("Updated User");
    expect(body.get("avatar")).toBe(avatar);
  });

  it("updates the profile without an avatar field when none is provided", async () => {
    apiFormRequest.mockResolvedValue({ ...authUser, name: "Name only" });

    await expect(
      updateProfile("access-token", { name: "Name only" }),
    ).resolves.toEqual({ ...authUser, name: "Name only" });

    const body = apiFormRequest.mock.calls[0]?.[1]?.body as FormData;
    expect(body.get("name")).toBe("Name only");
    expect(body.get("avatar")).toBeNull();
  });
});
