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
import { parsePassageTable } from "@/features/tests/run/lib/parsePassageTable";

const sampleTable = `[row]
[col w=30%]
To
hello
[/col]
[col]
Camile
[/col]
[/row]
[row]
[col]
From
[/col]
[col]
Masae
[/col]
[/row]`;

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

  it("parses bold inline text", () => {
    const input = "Please read the [bold]updated policy[/bold] carefully.";

    expect(parsePassageContent(input)).toEqual({
      kind: "parsed",
      blocks: [
        {
          type: "plain",
          inlines: [
            { type: "text", value: "Please read the " },
            {
              type: "bold",
              inlines: [{ type: "text", value: "updated policy" }],
            },
            { type: "text", value: " carefully." },
          ],
        },
      ],
    });
  });

  it("parses bold with evidence inside center blocks", () => {
    const input =
      "[center][bold]{{q91}}Important deadline{{/q91}}[/bold][/center]";

    expect(parsePassageContent(input)).toEqual({
      kind: "parsed",
      blocks: [
        {
          type: "center",
          inlines: [
            {
              type: "bold",
              inlines: [
                {
                  type: "evidence",
                  questionNumbers: [91],
                  value: "Important deadline",
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it("falls back to raw content for malformed bold markup", () => {
    const input = "Please read the [bold]updated policy carefully.";

    expect(parsePassageContent(input)).toEqual({
      kind: "raw",
      content: input,
    });
  });

  it("parses table blocks with row-level column widths", () => {
    const input = `[table]
${sampleTable}
[/table]`;

    expect(parsePassageContent(input)).toEqual({
      kind: "parsed",
      blocks: [
        {
          type: "table",
          rows: parsePassageTable(sampleTable)!.rows,
        },
      ],
    });
  });

  it("falls back to raw content when table rows are uneven", () => {
    const input = `[table]
[row]
[col]A[/col]
[col]B[/col]
[/row]
[row]
[col]C[/col]
[/row]
[/table]`;

    expect(parsePassageContent(input)).toEqual({
      kind: "raw",
      content: input,
    });
  });
});
