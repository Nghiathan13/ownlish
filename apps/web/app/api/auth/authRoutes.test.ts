import { beforeEach, describe, expect, it, vi } from "vitest";

const { credentialAuthMock, logoutAuthMock, publicAuthMock, refreshAuthMock } = vi.hoisted(() => ({
  credentialAuthMock: vi.fn(),
  logoutAuthMock: vi.fn(),
  publicAuthMock: vi.fn(),
  refreshAuthMock: vi.fn(),
}));

vi.mock("@/_app/api-routes/auth/handleCredentialAuth", () => ({
  handleCredentialAuth: credentialAuthMock,
  handlePublicAuth: publicAuthMock,
}));

vi.mock("@/_app/api-routes/auth/handleLogoutAuth", () => ({
  handleLogoutAuth: logoutAuthMock,
}));

vi.mock("@/_app/api-routes/auth/handleRefreshAuth", () => ({
  handleRefreshAuth: refreshAuthMock,
}));

import { POST as google } from "./google/route";
import { POST as login } from "./login/route";
import { POST as logout } from "./logout/route";
import { POST as refresh } from "./refresh/route";
import { POST as register } from "./register/route";
import { POST as requestEmailOtp } from "./email-otp/request/route";
import { POST as verifyEmailOtp } from "./email-otp/verify/route";
import { POST as completeEmailOtpProfile } from "./email-otp/complete-profile/route";

describe("auth BFF routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["login", login, "/auth/login"],
    ["register", register, "/auth/register"],
  ])("forwards the raw request body for %s", async (_name, handler, path) => {
    const response = new Response(null, { status: 200 });
    credentialAuthMock.mockResolvedValue(response);
    const request = new Request("http://localhost/api/auth", {
      method: "POST",
      body: '{"email":"user@example.com"}',
    });

    await expect(handler(request)).resolves.toBe(response);

    expect(credentialAuthMock).toHaveBeenCalledWith(
      path,
      '{"email":"user@example.com"}',
    );
  });

  it("forwards Google body and the requested-with header", async () => {
    const response = new Response(null, { status: 200 });
    credentialAuthMock.mockResolvedValue(response);
    const request = new Request("http://localhost/api/auth/google", {
      method: "POST",
      headers: { "X-Requested-With": "XMLHttpRequest" },
      body: '{"credential":"google-token"}',
    });

    await expect(google(request)).resolves.toBe(response);

    expect(credentialAuthMock).toHaveBeenCalledWith(
      "/auth/google",
      '{"credential":"google-token"}',
      { "X-Requested-With": "XMLHttpRequest" },
    );
  });

  it("sends an empty requested-with header for a Google request without one", async () => {
    credentialAuthMock.mockResolvedValue(new Response(null, { status: 200 }));

    await google(new Request("http://localhost/api/auth/google", { method: "POST" }));

    expect(credentialAuthMock).toHaveBeenCalledWith("/auth/google", "", {
      "X-Requested-With": "",
    });
  });

  it("delegates refresh and logout without passing request data", async () => {
    const refreshResponse = new Response(null, { status: 200 });
    const logoutResponse = new Response(null, { status: 204 });
    refreshAuthMock.mockResolvedValue(refreshResponse);
    logoutAuthMock.mockResolvedValue(logoutResponse);

    await expect(refresh()).resolves.toBe(refreshResponse);
    await expect(logout()).resolves.toBe(logoutResponse);
    expect(refreshAuthMock).toHaveBeenCalledOnce();
    expect(logoutAuthMock).toHaveBeenCalledOnce();
  });

  it("uses the public handler only to request a code", async () => {
    const response = new Response(null, { status: 201 });
    publicAuthMock.mockResolvedValue(response);
    const request = new Request("http://localhost/api/auth/email-otp/request", {
      method: "POST",
      body: '{"email":"user@example.com"}',
    });

    await expect(requestEmailOtp(request)).resolves.toBe(response);
    expect(publicAuthMock).toHaveBeenCalledWith(
      "/auth/email-otp/request",
      '{"email":"user@example.com"}',
    );
  });

  it.each([
    ["verify", verifyEmailOtp, "/auth/email-otp/verify"],
    ["complete profile", completeEmailOtpProfile, "/auth/email-otp/complete-profile"],
  ])("forwards %s through the cookie-capable handler", async (_name, handler, path) => {
    const response = new Response(null, { status: 200 });
    credentialAuthMock.mockResolvedValue(response);
    const request = new Request("http://localhost/api/auth/email-otp", {
      method: "POST",
      body: "{}",
    });

    await expect(handler(request)).resolves.toBe(response);
    expect(credentialAuthMock).toHaveBeenCalledWith(path, "{}");
  });
});
