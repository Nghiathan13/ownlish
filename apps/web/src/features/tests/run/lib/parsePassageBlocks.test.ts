import { describe, expect, it } from "vitest";
import {
  isValidPassageBlockMarkup,
  parsePassageBlocks,
} from "@/features/tests/run/lib/parsePassageBlocks";

describe("parsePassageBlocks table wrapper", () => {
  it("parses table wrapper modifiers", () => {
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
        tableModifier: "center",
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
  });
});
