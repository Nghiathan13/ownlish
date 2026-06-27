import { describe, expect, it } from "vitest";
import { adminToeicGroupMayHaveAudio } from "./adminToeicGroupAudioEligibility";

describe("adminToeicGroupMayHaveAudio", () => {
  it("allows listening parts 1 through 4", () => {
    expect(adminToeicGroupMayHaveAudio(1)).toBe(true);
    expect(adminToeicGroupMayHaveAudio(4)).toBe(true);
  });

  it("disallows reading parts", () => {
    expect(adminToeicGroupMayHaveAudio(5)).toBe(false);
    expect(adminToeicGroupMayHaveAudio(7)).toBe(false);
  });
});
