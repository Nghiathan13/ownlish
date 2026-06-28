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
          center: false,
          cols: [
            {
              widthPercent: 30,
              center: false,
              inlines: [{ type: "text", value: "To\nhello" }],
            },
            {
              widthPercent: null,
              center: false,
              inlines: [{ type: "text", value: "Camile" }],
            },
          ],
        },
        {
          center: false,
          cols: [
            {
              widthPercent: null,
              center: false,
              inlines: [{ type: "text", value: "From" }],
            },
            {
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
[col center]2:00 P.M.[/col center]
[/row center]`;

    expect(parsePassageTable(input)).toEqual({
      rows: [
        {
          center: true,
          cols: [
            {
              widthPercent: null,
              center: false,
              inlines: [{ type: "text", value: "7:00 A.M." }],
            },
            {
              widthPercent: null,
              center: false,
              inlines: [{ type: "text", value: "--" }],
            },
            {
              widthPercent: null,
              center: true,
              inlines: [{ type: "text", value: "2:00 P.M." }],
            },
          ],
        },
      ],
    });
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
      parsePassageTable("[row center][col]A[/col][/row]"),
    ).toBeNull();
    expect(
      parsePassageTable("[row][col center]A[/col][/row]"),
    ).toBeNull();
  });
});

describe("getTableColumnStyle", () => {
  it("splits remaining width equally when columns have no width", () => {
    const cols = [
      { widthPercent: null, center: false, inlines: [] },
      { widthPercent: null, center: false, inlines: [] },
    ];

    expect(getTableColumnStyle(cols[0]!, cols)).toEqual({
      flexBasis: "50%",
      flexGrow: 1,
    });
  });

  it("allocates the remaining width to flexible columns", () => {
    const cols = [
      { widthPercent: 30, center: false, inlines: [] },
      { widthPercent: null, center: false, inlines: [] },
    ];

    expect(getTableColumnStyle(cols[1]!, cols)).toEqual({
      flexBasis: "70%",
      flexGrow: 1,
    });
  });
});
