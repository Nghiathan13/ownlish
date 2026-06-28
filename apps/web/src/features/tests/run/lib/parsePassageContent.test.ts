import { describe, expect, it } from "vitest";
import {
  hasPassageFormatMarkers,
  isValidPassageBlockMarkup,
  parsePassageBlocks,
} from "@/features/tests/run/lib/parsePassageBlocks";
import {
  parsePassageContent,
  passageContentHasEvidence,
} from "@/features/tests/run/lib/parsePassageContent";

describe("parsePassageBlocks", () => {
  it("detects center format markers", () => {
    expect(hasPassageFormatMarkers("[center]Title[/center]")).toBe(true);
    expect(hasPassageFormatMarkers("plain text")).toBe(false);
  });

  it("parses plain and center blocks", () => {
    const input = "Dear Team,\n\n[center]MEMORANDUM[/center]\n\nPlease review.";

    expect(parsePassageBlocks(input)).toEqual([
      { type: "plain", raw: "Dear Team,\n\n" },
      { type: "center", raw: "MEMORANDUM" },
      { type: "plain", raw: "\nPlease review." },
    ]);
  });

  it("returns null for malformed center markup", () => {
    expect(isValidPassageBlockMarkup("[center]Title")).toBe(false);
    expect(isValidPassageBlockMarkup("Title[/center]")).toBe(false);
    expect(isValidPassageBlockMarkup("[center]A[center]B[/center][/center]")).toBe(
      false,
    );
    expect(parsePassageBlocks("[center]Title")).toBeNull();
  });
});

describe("parsePassageContent", () => {
  it("parses centered evidence spans", () => {
    const input = "[center]{{q91}}Important deadline{{/q91}}[/center]";

    expect(parsePassageContent(input)).toEqual({
      kind: "parsed",
      blocks: [
        {
          type: "center",
          inlines: [
            {
              type: "evidence",
              questionNumbers: [91],
              value: "Important deadline",
            },
          ],
        },
      ],
    });
  });

  it("falls back to raw content for malformed format tags", () => {
    const input = "[center]MEMORANDUM";

    expect(parsePassageContent(input)).toEqual({
      kind: "raw",
      content: input,
    });
  });

  it("keeps plain passages as a single block", () => {
    const input = "Line 1\nLine 2";

    expect(parsePassageContent(input)).toEqual({
      kind: "parsed",
      blocks: [
        {
          type: "plain",
          inlines: [{ type: "text", value: input }],
        },
      ],
    });
  });

  it("detects evidence in parsed passage content", () => {
    expect(
      passageContentHasEvidence("[center]{{q91}}text{{/q91}}[/center]"),
    ).toBe(true);
    expect(passageContentHasEvidence("[center]plain[/center]")).toBe(false);
  });
});
