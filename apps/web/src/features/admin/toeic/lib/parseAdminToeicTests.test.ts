import { describe, expect, it } from "vitest";
import { parseAdminToeicTestListResponse } from "@/features/admin/toeic/lib/parseAdminToeicTests";

const validPayload = {
  items: [
    {
      id: 5,
      year: 2026,
      testNumber: 1,
      parts: [
        { partNumber: 5, groupCount: 2, questionCount: 48 },
        { partNumber: 6, groupCount: 1, questionCount: 16 },
      ],
    },
  ],
};

describe("parseAdminToeicTestListResponse", () => {
  it("parses valid list payload", () => {
    expect(parseAdminToeicTestListResponse(validPayload)).toEqual(validPayload);
  });

  it("rejects missing items", () => {
    expect(() => parseAdminToeicTestListResponse({})).toThrow();
  });
});
