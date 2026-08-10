import { describe, expect, it } from "vitest";
import { isImmersiveTestPath, isMockTestPath } from "./isImmersiveTestPath";

describe("immersive test paths", () => {
  it("recognizes version-four UUID TOEIC run paths", () => {
    const path = "/tests/123e4567-e89b-42d3-a456-426614174000/mock_test";

    expect(isImmersiveTestPath(path)).toBe(true);
    expect(isMockTestPath(path)).toBe(true);
  });

  it("recognizes part-practice paths but not unrelated routes", () => {
    const partPracticePath =
      "/tests/part-practice/123e4567-e89b-42d3-a456-426614174000";

    expect(isImmersiveTestPath(partPracticePath)).toBe(true);
    expect(isImmersiveTestPath("/tests?tab=mock_tests")).toBe(false);
    expect(isMockTestPath(partPracticePath)).toBe(false);
  });
});
