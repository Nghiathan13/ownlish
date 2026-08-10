import { describe, expect, it } from "vitest";
import {
  showsGroupContentTranslation,
  showsOptionTranslation,
  showsQuestionTranslation,
} from "./partTranslationVisibility";

describe("part translation visibility", () => {
  it("maps question and option translation variants", () => {
    expect(showsQuestionTranslation("question-options")).toBe(true);
    expect(showsQuestionTranslation("options")).toBe(false);
    expect(showsOptionTranslation("options")).toBe(true);
    expect(showsOptionTranslation("content-question-options")).toBe(true);
    expect(showsOptionTranslation("question-options")).toBe(true);
  });

  it("shows group content for passages and content translation variants", () => {
    expect(
      showsGroupContentTranslation({
        leftPanel: "passage",
        translationVariant: "options",
      }),
    ).toBe(true);
    expect(
      showsGroupContentTranslation({
        leftPanel: "audio",
        translationVariant: "content-options",
      }),
    ).toBe(true);
    expect(
      showsGroupContentTranslation({
        leftPanel: "audio",
        translationVariant: "options",
      }),
    ).toBe(false);
  });
});
