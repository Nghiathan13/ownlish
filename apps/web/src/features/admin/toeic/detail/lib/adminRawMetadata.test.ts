import { describe, expect, it } from "vitest";
import {
  formatAdminRawMetadataLabel,
  getAdminRawMetadataLines,
} from "@/features/admin/toeic/detail/lib/adminRawMetadata";

describe("formatAdminRawMetadataLabel", () => {
  it("stringifies JSON array values", () => {
    expect(formatAdminRawMetadataLabel('["W_Br"]')).toBe('["W_Br"]');
    expect(formatAdminRawMetadataLabel('["W_Am","M_Cn"]')).toBe(
      '["W_Am","M_Cn"]',
    );
  });

  it("keeps plain scalar values as stored", () => {
    expect(formatAdminRawMetadataLabel("us")).toBe("us");
  });
});

describe("getAdminRawMetadataLines", () => {
  it("returns accent only for part 1", () => {
    expect(
      getAdminRawMetadataLines(
        { groupType: '["photo"]', accent: '["W_Br"]' },
        1,
      ),
    ).toEqual(['["W_Br"]']);
  });

  it("returns group type and accent for part 3", () => {
    expect(
      getAdminRawMetadataLines(
        {
          groupType: '["conversation_2"]',
          accent: '["W_Am","M_Cn"]',
        },
        3,
      ),
    ).toEqual(['["conversation_2"]', '["W_Am","M_Cn"]']);
  });
});
