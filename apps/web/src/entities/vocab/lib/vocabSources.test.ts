import { describe, expect, it } from "vitest";
import { isOxfordDefinitionSource } from "./vocabSources";

describe("isOxfordDefinitionSource", () => {
  it.each(["oxford_3000", "oxford_5000"])("accepts %s", (source) => {
    expect(isOxfordDefinitionSource(source)).toBe(true);
  });

  it("rejects other vocabulary sources", () => {
    expect(isOxfordDefinitionSource("manual")).toBe(false);
  });
});
