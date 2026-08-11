import { describe, expect, it } from "vitest";
import { extractRefreshTokenFromResponse } from "@/_app/api-routes/auth/refreshCookie";

describe("extractRefreshTokenFromResponse", () => {
  it("reads refresh token from Set-Cookie headers", () => {
    const response = new Response(null, {
      headers: {
        "set-cookie":
          "ownlish.refreshToken=token-value; Path=/auth; HttpOnly; Secure; SameSite=None",
      },
    });

    expect(extractRefreshTokenFromResponse(response)).toBe("token-value");
  });

  it("decodes encoded refresh token values", () => {
    const response = new Response(null, {
      headers: {
        "set-cookie": "ownlish.refreshToken=abc%2F123; Path=/auth; HttpOnly",
      },
    });

    expect(extractRefreshTokenFromResponse(response)).toBe("abc/123");
  });

  it("returns undefined when refresh cookie is missing", () => {
    const response = new Response(null);

    expect(extractRefreshTokenFromResponse(response)).toBeUndefined();
  });
});
