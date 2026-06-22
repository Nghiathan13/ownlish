import { describe, expect, it } from "vitest";
import { getSafeAuthRedirectPath } from "./authRedirect";

describe("getSafeAuthRedirectPath", () => {
  it("falls back to dashboard for missing values", () => {
    expect(getSafeAuthRedirectPath(null)).toBe("/");
    expect(getSafeAuthRedirectPath("")).toBe("/");
  });

  it("allows internal paths", () => {
    expect(getSafeAuthRedirectPath("/review")).toBe("/review");
    expect(getSafeAuthRedirectPath("/collections?search=test")).toBe(
      "/collections?search=test",
    );
  });

  it("blocks non-path and protocol-relative redirects", () => {
    expect(getSafeAuthRedirectPath("https://example.com")).toBe("/");
    expect(getSafeAuthRedirectPath("//example.com")).toBe("/");
  });

  it("blocks redirects back to login", () => {
    expect(getSafeAuthRedirectPath("/login")).toBe("/");
    expect(getSafeAuthRedirectPath("/login?redirect=/review")).toBe("/");
  });
});
