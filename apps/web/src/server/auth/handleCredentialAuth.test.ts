import { describe, expect, it, vi } from "vitest";
import { REFRESH_COOKIE_NAME } from "@/server/auth/constants";

const { postUpstreamAuthMock } = vi.hoisted(() => ({
  postUpstreamAuthMock: vi.fn(),
}));

vi.mock("@/server/auth/upstreamAuth", () => ({
  postUpstreamAuth: postUpstreamAuthMock,
}));

import {
  handleCredentialAuth,
  handlePublicAuth,
} from "@/server/auth/handleCredentialAuth";

describe("handleCredentialAuth", () => {
  it("forwards an upstream error without setting a refresh cookie", async () => {
    const body = { message: "Invalid credentials" };
    postUpstreamAuthMock.mockResolvedValue({
      json: body,
      upstream: new Response(null, { status: 401 }),
    });

    const response = await handleCredentialAuth(
      "/auth/login",
      '{"email":"user@example.com"}',
    );

    expect(postUpstreamAuthMock).toHaveBeenCalledWith(
      "/auth/login",
      '{"email":"user@example.com"}',
    );
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual(body);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("forwards a successful response and applies the refresh cookie", async () => {
    postUpstreamAuthMock.mockResolvedValue({
      json: { accessToken: "access-token" },
      upstream: new Response(null, {
        status: 201,
        headers: {
          "set-cookie": `${REFRESH_COOKIE_NAME}=refresh%2Ftoken; Path=/; HttpOnly`,
        },
      }),
    });

    const response = await handleCredentialAuth("/auth/register", "{}", {
      "X-Requested-With": "XMLHttpRequest",
    });

    expect(postUpstreamAuthMock).toHaveBeenCalledWith("/auth/register", "{}", {
      "X-Requested-With": "XMLHttpRequest",
    });
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ accessToken: "access-token" });
    expect(response.headers.get("set-cookie")).toContain(
      `${REFRESH_COOKIE_NAME}=refresh%2Ftoken`,
    );
    expect(response.headers.get("set-cookie")).toContain("Path=/api/auth");
  });

  it("keeps a successful response cookie-free when the upstream does not rotate one", async () => {
    postUpstreamAuthMock.mockResolvedValue({
      json: { accessToken: "access-token" },
      upstream: new Response(null, { status: 200 }),
    });

    const response = await handleCredentialAuth("/auth/google", "{}");

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("never forwards an upstream refresh cookie from a public OTP request", async () => {
    postUpstreamAuthMock.mockResolvedValue({
      json: { challengeId: "challenge-id" },
      upstream: new Response(null, {
        status: 201,
        headers: {
          "set-cookie": `${REFRESH_COOKIE_NAME}=refresh-token; Path=/; HttpOnly`,
        },
      }),
    });

    const response = await handlePublicAuth("/auth/email-otp/request", "{}");

    expect(response.status).toBe(201);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
