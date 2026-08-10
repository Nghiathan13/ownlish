import { describe, expect, it } from "vitest";
import { getShellLayoutMode } from "./shellRoutes";

describe("getShellLayoutMode", () => {
  it.each([
    ["/login", "bare"],
    ["/tests/12345678-1234-4123-8123-123456789abc/mock_test", "immersive"],
    ["/admin/toeic/42", "immersive"],
    ["/admin/toeic/new", "default"],
    ["/review", "default"],
  ] as const)("returns %s for %s", (pathname, expected) => {
    expect(getShellLayoutMode(pathname)).toBe(expected);
  });
});
