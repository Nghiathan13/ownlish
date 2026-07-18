import { describe, expect, it } from "vitest";
import { resolveToeicCatalogMediaUrl } from "./media";

describe("resolveToeicCatalogMediaUrl", () => {
  it("resolves a media path from the bucket root", () => {
    expect(
      resolveToeicCatalogMediaUrl(
        {
          rootUrl: "https://example.supabase.co/storage/v1/object/public/toeic/",
          manifest: {
            schemaVersion: 1,
            tests: [],
            partPractice: [],
            mediaByGroupId: {},
          },
        },
        "ets_26/test_01/001.mp3",
      ),
    ).toBe(
      "https://example.supabase.co/storage/v1/object/public/toeic/ets_26/test_01/001.mp3",
    );
  });
});
