import { describe, expect, it } from "vitest";
import {
  isValidPassageBlockMarkup,
  parsePassageBlocks,
} from "@/features/tests/run/lib/parsePassageBlocks";
import { parseTableOpenTag } from "@/features/tests/run/lib/parsePassageTableWrapper";

describe("parsePassageTableWrapper", () => {
  it("parses modifiers in center, w, bold order", () => {
    expect(parseTableOpenTag("[table center w=30% bold]", 0)).toEqual({
      length: "[table center w=30% bold]".length,
      attrs: { center: true, widthPercent: 30, bold: true },
    });
  });

  it("parses table width without other modifiers", () => {
    expect(parseTableOpenTag("[table w=30%]", 0)?.attrs).toEqual({
      center: false,
      widthPercent: 30,
      bold: false,
    });
  });

  it("parses center and bold while skipping width", () => {
    expect(parseTableOpenTag("[table center bold]", 0)?.attrs).toEqual({
      center: true,
      widthPercent: null,
      bold: true,
    });
  });

  it("rejects modifiers outside center, w, bold order", () => {
    expect(parseTableOpenTag("[table w=30% center]", 0)).toBeNull();
    expect(parseTableOpenTag("[table bold w=30%]", 0)).toBeNull();
    expect(parseTableOpenTag("[table bold center]", 0)).toBeNull();
  });

  it("rejects width above 100 percent", () => {
    expect(parseTableOpenTag("[table w=101%]", 0)).toBeNull();
  });
});

describe("parsePassageBlocks table wrapper", () => {
  it("parses table wrapper center modifier", () => {
    expect(
      parsePassageBlocks(`[table center]
[row]
[col]A[/col]
[/row]
[/table center]`),
    ).toEqual([
      {
        type: "table",
        raw: `[row]
[col]A[/col]
[/row]`,
        tableAttrs: { center: true, widthPercent: null, bold: false },
      },
    ]);
  });

  it("parses table wrapper width with matching close tag", () => {
    expect(
      parsePassageBlocks(`[table center w=30%]
[row]
[col]A[/col]
[/row]
[/table center w=30%]`),
    ).toEqual([
      {
        type: "table",
        raw: `[row]
[col]A[/col]
[/row]`,
        tableAttrs: { center: true, widthPercent: 30, bold: false },
      },
    ]);
  });

  it("parses full modifier order on close tag", () => {
    expect(
      parsePassageBlocks(`[table center w=30% bold]
[row]
[col]A[/col]
[/row]
[/table center w=30% bold]`),
    ).toEqual([
      {
        type: "table",
        raw: `[row]
[col]A[/col]
[/row]`,
        tableAttrs: { center: true, widthPercent: 30, bold: true },
      },
    ]);
  });

  it("rejects mismatched table wrapper close tags", () => {
    expect(
      isValidPassageBlockMarkup(`[table bold]
[row]
[col]A[/col]
[/row]
[/table]`),
    ).toBe(false);

    expect(
      isValidPassageBlockMarkup(`[table center w=30%]
[row]
[col]A[/col]
[/row]
[/table center]`),
    ).toBe(false);
  });
});
