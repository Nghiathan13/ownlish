import { describe, expect, it } from "vitest";
import { isAccessTokenExpired, parseAccessTokenPayload } from "./accessTokenExpiry";

function createTestToken(exp: number): string {
  const encode = (value: string) =>
    btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const header = encode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = encode(
    JSON.stringify({ sub: "user-1", email: "user@example.com", exp }),
  );

  return `${header}.${payload}.signature`;
}

describe("accessTokenExpiry", () => {
  it("parses JWT payload claims", () => {
    const token = createTestToken(Math.floor(Date.now() / 1000) + 3600);

    expect(parseAccessTokenPayload(token)).toMatchObject({
      sub: "user-1",
      email: "user@example.com",
    });
  });

  it("treats malformed tokens as expired", () => {
    expect(isAccessTokenExpired("not-a-jwt")).toBe(true);
    expect(parseAccessTokenPayload("not-a-jwt")).toBeNull();
  });

  it("returns false for a valid unexpired token", () => {
    const token = createTestToken(Math.floor(Date.now() / 1000) + 3600);

    expect(isAccessTokenExpired(token)).toBe(false);
  });

  it("returns true for an expired token", () => {
    const token = createTestToken(Math.floor(Date.now() / 1000) - 120);

    expect(isAccessTokenExpired(token)).toBe(true);
  });

  it("applies skew before expiry", () => {
    const token = createTestToken(Math.floor(Date.now() / 1000) + 30);

    expect(isAccessTokenExpired(token, { skewSeconds: 60 })).toBe(true);
    expect(isAccessTokenExpired(token, { skewSeconds: 0 })).toBe(false);
  });
});
