import { describe, expect, it } from "vitest";
import { getDictationVideoDocumentPath } from "./videoPath";

describe("getDictationVideoDocumentPath", () => {
  it("builds the video JSON path from the video id", () => {
    expect(getDictationVideoDocumentPath("7BIp53who2A")).toBe(
      "videos/7BIp53who2A.json",
    );
  });
});
