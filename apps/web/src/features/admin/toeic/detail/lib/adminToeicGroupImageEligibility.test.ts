import { describe, expect, it } from "vitest";
import { adminToeicGroupMayHaveImage } from "./adminToeicGroupImageEligibility";

describe("adminToeicGroupMayHaveImage", () => {
  it("allows all part 1 groups", () => {
    expect(adminToeicGroupMayHaveImage(1, 1, 1)).toBe(true);
    expect(adminToeicGroupMayHaveImage(1, 6, 6)).toBe(true);
  });

  it("allows only the last three part 3 groups", () => {
    expect(adminToeicGroupMayHaveImage(3, 62, 64)).toBe(true);
    expect(adminToeicGroupMayHaveImage(3, 65, 67)).toBe(true);
    expect(adminToeicGroupMayHaveImage(3, 68, 70)).toBe(true);
    expect(adminToeicGroupMayHaveImage(3, 32, 34)).toBe(false);
  });

  it("allows only the last two part 4 groups", () => {
    expect(adminToeicGroupMayHaveImage(4, 95, 97)).toBe(true);
    expect(adminToeicGroupMayHaveImage(4, 98, 100)).toBe(true);
    expect(adminToeicGroupMayHaveImage(4, 71, 73)).toBe(false);
  });

  it("disallows part 2 groups", () => {
    expect(adminToeicGroupMayHaveImage(2, 7, 7)).toBe(false);
  });
});
