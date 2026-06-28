import { describe, expect, it } from "vitest";
import {
  getTableColumnStyle,
  parsePassageTable,
} from "@/features/tests/run/lib/parsePassageTable";

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

describe("parsePassageTable", () => {
  it("parses rows and columns with per-row widths", () => {
    expect(parsePassageTable(sampleTable)).toEqual({
      rows: [
        {
          bold: false,
          border: false,
          center: false,
          cols: [
            {
              border: false,
              widthPercent: 30,
              center: false,
              inlines: [{ type: "text", value: "To\nhello" }],
            },
            {
              border: false,
              widthPercent: null,
              center: false,
              inlines: [{ type: "text", value: "Camile" }],
            },
          ],
        },
        {
          bold: false,
          border: false,
          center: false,
          cols: [
            {
              border: false,
              widthPercent: null,
              center: false,
              inlines: [{ type: "text", value: "From" }],
            },
            {
              border: false,
              widthPercent: null,
              center: false,
              inlines: [{ type: "text", value: "Masae" }],
            },
          ],
        },
      ],
    });
  });

  it("parses row and column center modifiers", () => {
    const input = `[row center]
[col]7:00 A.M.[/col]
[col]--[/col]
[col center]2:00 P.M.[/col]
[/row]`;

    expect(parsePassageTable(input)).toEqual({
      rows: [
        {
          bold: false,
          border: false,
          center: true,
          cols: [
            {
              border: false,
              widthPercent: null,
              center: false,
              inlines: [{ type: "text", value: "7:00 A.M." }],
            },
            {
              border: false,
              widthPercent: null,
              center: false,
              inlines: [{ type: "text", value: "--" }],
            },
            {
              border: false,
              widthPercent: null,
              center: true,
              inlines: [{ type: "text", value: "2:00 P.M." }],
            },
          ],
        },
      ],
    });
  });

  it("parses row center and bold modifiers in order", () => {
    const input = `[row center bold]
[col]Header[/col]
[/row]`;

    expect(parsePassageTable(input)).toEqual({
      rows: [
        {
          bold: true,
          border: false,
          center: true,
          cols: [
            {
              border: false,
              widthPercent: null,
              center: false,
              inlines: [{ type: "text", value: "Header" }],
            },
          ],
        },
      ],
    });
  });

  it("parses row bold without center", () => {
    const input = `[row bold]
[col]Total[/col]
[/row]`;

    expect(parsePassageTable(input)?.rows[0]?.bold).toBe(true);
    expect(parsePassageTable(input)?.rows[0]?.center).toBe(false);
  });

  it("parses col and row border modifiers", () => {
    const input = `[row border]
[col border]A[/col]
[col]B[/col]
[/row]`;

    expect(parsePassageTable(input)).toEqual({
      rows: [
        {
          bold: false,
          border: true,
          center: false,
          cols: [
            {
              border: true,
              widthPercent: null,
              center: false,
              inlines: [{ type: "text", value: "A" }],
            },
            {
              border: false,
              widthPercent: null,
              center: false,
              inlines: [{ type: "text", value: "B" }],
            },
          ],
        },
      ],
    });
  });

  it("rejects row border before bold", () => {
    expect(parsePassageTable("[row border bold][col]A[/col][/row]")).toBeNull();
  });

  it("returns null when rows have different column counts", () => {
    const input = `[row]
[col]A[/col]
[col]B[/col]
[/row]
[row]
[col]C[/col]
[/row]`;

    expect(parsePassageTable(input)).toBeNull();
  });

  it("returns null when explicit widths exceed 100 percent", () => {
    const input = `[row]
[col w=60%]A[/col]
[col w=50%]B[/col]
[/row]`;

    expect(parsePassageTable(input)).toBeNull();
  });

  it("returns null for malformed table markup", () => {
    expect(parsePassageTable("[row][col]A[/col]")).toBeNull();
    expect(parsePassageTable("[row][col w=abc%]A[/col][/row]")).toBeNull();
    expect(
      parsePassageTable("[row bold center][col]A[/col][/row]"),
    ).toBeNull();
    expect(
      parsePassageTable("[row center][col]A[/col][/row center]"),
    ).toBeNull();
    expect(
      parsePassageTable("[row][col center]A[/col center][/row]"),
    ).toBeNull();
  });

  it("parses row center with plain close tag", () => {
    expect(
      parsePassageTable("[row center][col]A[/col][/row]")?.rows[0]?.center,
    ).toBe(true);
  });
});

describe("getTableColumnStyle", () => {
  it("splits remaining width equally when columns have no width", () => {
    const cols = [
      { border: false, widthPercent: null, center: false, inlines: [] },
      { border: false, widthPercent: null, center: false, inlines: [] },
    ];

    expect(getTableColumnStyle(cols[0]!, cols)).toEqual({
      flexBasis: "50%",
      flexGrow: 1,
    });
  });

  it("allocates the remaining width to flexible columns", () => {
    const cols = [
      { border: false, widthPercent: 30, center: false, inlines: [] },
      { border: false, widthPercent: null, center: false, inlines: [] },
    ];

    expect(getTableColumnStyle(cols[1]!, cols)).toEqual({
      flexBasis: "70%",
      flexGrow: 1,
    });
  });
});
