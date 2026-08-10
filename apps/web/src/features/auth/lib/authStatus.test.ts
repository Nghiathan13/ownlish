import { describe, expect, it } from "vitest";
import { isAuthenticatedStatus, isLoadingStatus } from "./authStatus";

describe("auth status helpers", () => {
  it("identifies authenticated status only", () => {
    expect(isAuthenticatedStatus("authenticated")).toBe(true);
    expect(isAuthenticatedStatus("guest")).toBe(false);
    expect(isAuthenticatedStatus("loading")).toBe(false);
  });

  it("identifies loading status only", () => {
    expect(isLoadingStatus("loading")).toBe(true);
    expect(isLoadingStatus("authenticated")).toBe(false);
    expect(isLoadingStatus("guest")).toBe(false);
  });
});
