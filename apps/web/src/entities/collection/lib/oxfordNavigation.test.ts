import { describe, expect, it } from "vitest";
import {
  getOxfordGroupRange,
  getOxfordPath,
  parseOxfordBand,
  parseOxfordGroup,
} from "./oxfordNavigation";

describe("oxfordNavigation", () => {
  it("builds stable group URLs", () => {
    expect(getOxfordPath("A1")).toBe("/collections/oxford/A1");
    expect(getOxfordPath("A1", 3)).toBe("/collections/oxford/A1/part-3");
  });

  it("splits the final A1 group to its remaining words", () => {
    expect(getOxfordGroupRange(48, 957)).toEqual({
      end: 957,
      label: "941–957",
      offset: 940,
      wordCount: 17,
    });
  });

  it("accepts only supported bands and positive group numbers", () => {
    expect(parseOxfordBand("B2")).toBe("B2");
    expect(parseOxfordBand("C2")).toBeNull();
    expect(parseOxfordGroup("part-1")).toBe(1);
    expect(parseOxfordGroup("1")).toBe(1);
    expect(parseOxfordGroup("part-0")).toBeNull();
    expect(parseOxfordGroup("0")).toBeNull();
    expect(parseOxfordGroup("1.5")).toBeNull();
  });
});
