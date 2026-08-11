import { describe, expect, it } from "vitest";
import {
  formatGroupTypeList,
  getPartInstruction,
  mergeConsecutiveGroupTypes,
  normalizeGroupTypeLabel,
  parseGroupTypes,
} from "./partInstruction";

describe("parseGroupTypes", () => {
  it("parses json array strings", () => {
    expect(parseGroupTypes('["flyer"]')).toEqual(["flyer"]);
    expect(parseGroupTypes('["article","email"]')).toEqual(["article", "email"]);
  });

  it("falls back to plain strings", () => {
    expect(parseGroupTypes("photo")).toEqual(["photo"]);
  });

  it("returns empty for nullish values", () => {
    expect(parseGroupTypes(null)).toEqual([]);
    expect(parseGroupTypes("")).toEqual([]);
  });
});

describe("normalizeGroupTypeLabel", () => {
  it("replaces underscores with spaces", () => {
    expect(normalizeGroupTypeLabel("press_release")).toBe("press release");
  });
});

describe("mergeConsecutiveGroupTypes", () => {
  it("pluralizes consecutive runs of the same type", () => {
    expect(
      mergeConsecutiveGroupTypes([
        "email",
        "email",
        "email",
        "form",
        "form",
        "email",
      ]),
    ).toEqual(["emails", "forms", "email"]);
  });

  it("merges short consecutive runs", () => {
    expect(mergeConsecutiveGroupTypes(["email", "email", "form"])).toEqual([
      "emails",
      "form",
    ]);
  });

  it("keeps single values unchanged", () => {
    expect(mergeConsecutiveGroupTypes(["flyer"])).toEqual(["flyer"]);
  });
});

describe("formatGroupTypeList", () => {
  it("joins two values with and", () => {
    expect(formatGroupTypeList(["article", "email"])).toBe("article and email");
  });

  it("joins three or more values without oxford comma", () => {
    expect(formatGroupTypeList(["article", "email", "press release"])).toBe(
      "article, email and press release",
    );
  });
});

describe("getPartInstruction", () => {
  it("returns static instructions for parts 1 through 5", () => {
    expect(
      getPartInstruction(1, {
        questionStart: 1,
        questionEnd: 1,
        groupType: null,
      }),
    ).toBe(
      "Select the one statement that best describes what you see in the picture.",
    );
    expect(
      getPartInstruction(5, {
        questionStart: 129,
        questionEnd: 129,
        groupType: null,
      }),
    ).toBe("Select the best answer to complete the sentence.");
  });

  it("builds reading instructions for part 6 and 7", () => {
    expect(
      getPartInstruction(6, {
        questionStart: 131,
        questionEnd: 134,
        groupType: '["flyer"]',
      }),
    ).toBe("Questions 131-134 refer to the following flyer.");

    expect(
      getPartInstruction(7, {
        questionStart: 147,
        questionEnd: 148,
        groupType: '["notice"]',
      }),
    ).toBe("Questions 147-148 refer to the following notice.");

    expect(
      getPartInstruction(7, {
        questionStart: 176,
        questionEnd: 180,
        groupType: '["article", "email"]',
      }),
    ).toBe("Questions 176-180 refer to the following article and email.");
  });

  it("merges consecutive duplicate group types", () => {
    expect(
      getPartInstruction(7, {
        questionStart: 191,
        questionEnd: 195,
        groupType: '["email", "email", "form"]',
      }),
    ).toBe("Questions 191-195 refer to the following emails and form.");

    expect(
      getPartInstruction(7, {
        questionStart: 196,
        questionEnd: 200,
        groupType: '["email", "review", "notice"]',
      }),
    ).toBe("Questions 196-200 refer to the following email, review and notice.");
  });

  it("normalizes snake_case group types", () => {
    expect(
      getPartInstruction(6, {
        questionStart: 131,
        questionEnd: 134,
        groupType: '["press_release"]',
      }),
    ).toBe("Questions 131-134 refer to the following press release.");
  });

  it("omits group type when missing", () => {
    expect(
      getPartInstruction(6, {
        questionStart: 131,
        questionEnd: 134,
        groupType: null,
      }),
    ).toBe("Questions 131-134 refer to the following.");
  });

  it("keeps questions range when start equals end", () => {
    expect(
      getPartInstruction(6, {
        questionStart: 131,
        questionEnd: 131,
        groupType: '["email"]',
      }),
    ).toBe("Questions 131-131 refer to the following email.");
  });
});
