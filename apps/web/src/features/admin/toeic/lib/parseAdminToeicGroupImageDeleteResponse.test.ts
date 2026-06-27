import { describe, expect, it } from "vitest";
import { parseAdminToeicGroupImageDeleteResponse } from "./parseAdminToeicGroupImageDeleteResponse";

describe("parseAdminToeicGroupImageDeleteResponse", () => {
  it("parses a valid delete response", () => {
    expect(
      parseAdminToeicGroupImageDeleteResponse({
        group: {
          id: 101,
          imageUrl: null,
          imageUrlExpiresAt: null,
        },
      }),
    ).toEqual({
      group: {
        id: 101,
        imageUrl: null,
        imageUrlExpiresAt: null,
      },
    });
  });

  it("rejects non-null image fields", () => {
    expect(() =>
      parseAdminToeicGroupImageDeleteResponse({
        group: {
          id: 101,
          imageUrl: "https://example.com/image.png",
          imageUrlExpiresAt: null,
        },
      }),
    ).toThrow("Invalid admin TOEIC group image delete response");
  });
});
