import { describe, expect, it } from "vitest";
import { buildAdminToeicGroupCatalog } from "@/features/admin/toeic/detail/lib/adminToeicGroupCatalog";
import {
  normalizeGroupRangeInputs,
  parseGroupIndexInput,
} from "@/features/admin/toeic/detail/lib/adminGroupRawEditRange";

const catalog = buildAdminToeicGroupCatalog([
  {
    partNumber: 1,
    groups: [
      {
        id: 1,
        questionStart: 1,
        questionEnd: 1,
        groupType: null,
        accent: null,
        content: null,
        contentVi: null,
        audioUrl: null,
        audioUrlExpiresAt: null,
        imageUrl: null,
        imageUrlExpiresAt: null,
        questions: [],
      },
      {
        id: 2,
        questionStart: 2,
        questionEnd: 2,
        groupType: null,
        accent: null,
        content: null,
        contentVi: null,
        audioUrl: null,
        audioUrlExpiresAt: null,
        imageUrl: null,
        imageUrlExpiresAt: null,
        questions: [],
      },
    ],
  },
]);

describe("adminGroupRawEditRange", () => {
  it("parses and clamps group index inputs", () => {
    expect(parseGroupIndexInput("3")).toBe(3);
    expect(parseGroupIndexInput("104")).toBe(103);
    expect(parseGroupIndexInput("0")).toBeNull();
    expect(parseGroupIndexInput("2a")).toBeNull();
  });

  it("accepts valid ranges within the catalog", () => {
    expect(normalizeGroupRangeInputs("1", "2", catalog)).toEqual({
      from: 1,
      to: 2,
    });
  });

  it("rejects invalid ranges", () => {
    expect(normalizeGroupRangeInputs("4", "2", catalog)).toBeNull();
    expect(normalizeGroupRangeInputs("0", "2", catalog)).toBeNull();
    expect(normalizeGroupRangeInputs("1", "3", catalog)).toBeNull();
  });
});
