import { describe, expect, it } from "vitest";
import { DASHBOARD_MY_ACTIVITY_PATH } from "@/features/home/lib/dashboardPaths";
import { getSafeAuthRedirectPath } from "./authRedirect";

describe("getSafeAuthRedirectPath", () => {
  it("falls back to dashboard for missing values", () => {
    expect(getSafeAuthRedirectPath(null)).toBe(DASHBOARD_MY_ACTIVITY_PATH);
    expect(getSafeAuthRedirectPath("")).toBe(DASHBOARD_MY_ACTIVITY_PATH);
  });

  it("allows internal paths", () => {
    expect(getSafeAuthRedirectPath("/review")).toBe("/review");
    expect(getSafeAuthRedirectPath("/collections?search=test")).toBe(
      "/collections?search=test",
    );
  });

  it("blocks non-path and protocol-relative redirects", () => {
    expect(getSafeAuthRedirectPath("https://example.com")).toBe(
      DASHBOARD_MY_ACTIVITY_PATH,
    );
    expect(getSafeAuthRedirectPath("//example.com")).toBe(
      DASHBOARD_MY_ACTIVITY_PATH,
    );
  });

  it("blocks redirects back to login", () => {
    expect(getSafeAuthRedirectPath("/login")).toBe(DASHBOARD_MY_ACTIVITY_PATH);
    expect(getSafeAuthRedirectPath("/login?redirect=/review")).toBe(
      DASHBOARD_MY_ACTIVITY_PATH,
    );
  });
});
