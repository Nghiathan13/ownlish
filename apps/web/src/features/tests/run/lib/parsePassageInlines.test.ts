import { describe, expect, it } from "vitest";
import {
  hasPassageInlineFormatMarkers,
  isValidPassageInlineMarkup,
  parsePassageInlines,
} from "@/features/tests/run/lib/parsePassageInlines";

describe("parsePassageInlines", () => {
  it("detects border inline markers", () => {
    expect(hasPassageInlineFormatMarkers("[border]Title[/border]")).toBe(true);
  });

  it("detects bold inline markers", () => {
    expect(hasPassageInlineFormatMarkers("[bold]Title[/bold]")).toBe(true);
    expect(hasPassageInlineFormatMarkers("plain text")).toBe(false);
  });

  it("parses bold segments with surrounding text", () => {
    expect(parsePassageInlines("Read the [bold]memo[/bold] today.")).toEqual([
      { type: "text", value: "Read the " },
      {
        type: "bold",
        inlines: [{ type: "text", value: "memo" }],
      },
      { type: "text", value: " today." },
    ]);
  });

  it("parses border inline segments with surrounding text", () => {
    expect(parsePassageInlines("Note the [border]boxed[/border] term.")).toEqual([
      { type: "text", value: "Note the " },
      {
        type: "border",
        inlines: [{ type: "text", value: "boxed" }],
      },
      { type: "text", value: " term." },
    ]);
  });

  it("returns null for malformed bold markup", () => {
    expect(isValidPassageInlineMarkup("[bold]memo")).toBe(false);
    expect(parsePassageInlines("[bold]memo")).toBeNull();
  });
});
