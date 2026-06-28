import { describe, expect, it } from "vitest";
import {
  isValidPassageBlockMarkup,
  parsePassageBlocks,
} from "@/features/tests/run/lib/parsePassageBlocks";
import { parsePassageOpenTag } from "@/features/tests/run/lib/parsePassageWrapper";

describe("parsePassageWrapper", () => {
  it("parses border modifier on open tag", () => {
    expect(parsePassageOpenTag("[passage border]", 0)?.attrs).toEqual({
      border: true,
    });
  });

  it("accepts plain close tag only", () => {
    expect(parsePassageOpenTag("[passage]", 0)?.attrs).toEqual({
      border: false,
    });
  });
});

describe("parsePassageBlocks passage wrapper", () => {
  it("parses explicit passage blocks", () => {
    expect(
      parsePassageBlocks(`[passage]
Dear Team,

[center]MEMORANDUM[/center]
[/passage]`),
    ).toEqual([
      {
        type: "passage",
        passageAttrs: { border: false },
        children: [
          { type: "plain", raw: "Dear Team,\n\n" },
          {
            type: "center",
            children: [{ type: "plain", raw: "MEMORANDUM" }],
          },
        ],
      },
    ]);
  });

  it("parses multiple passage blocks", () => {
    expect(
      parsePassageBlocks(`[passage]
Section A
[/passage]
[passage border]
Section B
[/passage]`),
    ).toEqual([
      {
        type: "passage",
        passageAttrs: { border: false },
        children: [{ type: "plain", raw: "Section A" }],
      },
      {
        type: "passage",
        passageAttrs: { border: true },
        children: [{ type: "plain", raw: "Section B" }],
      },
    ]);
  });

  it("allows table inside passage", () => {
    expect(
      isValidPassageBlockMarkup(`[passage]
[table]
[row]
[col]A[/col]
[/row]
[/table]
[/passage]`),
    ).toBe(true);
  });

  it("rejects styled passage close tags", () => {
    expect(
      isValidPassageBlockMarkup(`[passage border]
Text
[/passage border]`),
    ).toBe(false);
  });
});
