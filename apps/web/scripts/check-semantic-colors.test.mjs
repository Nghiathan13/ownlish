import { describe, expect, it } from "vitest";
import { findDisallowedColors } from "./check-semantic-colors.mjs";

describe("semantic color guard", () => {
  it("rejects raw UI colors", () => {
    expect(
      findDisallowedColors(
        'const className = "bg-red-700 text-[#1f48da]";',
        "src/features/example/Example.tsx",
      ),
    ).toEqual(["bg-red-700", "#1f48da"]);
  });

  it("allows only the documented technical color exceptions", () => {
    expect(
      findDisallowedColors(
        'const mask = "radial-gradient(#000, transparent)";',
        "src/features/dashboard-progress/lib/reviewProgressDonut.ts",
      ),
    ).toEqual([]);
    expect(
      findDisallowedColors(
        'const color = "#ff0000";',
        "src/features/dashboard-progress/lib/reviewProgressDonut.ts",
      ),
    ).toEqual(["#ff0000"]);
  });
});
