import { describe, expect, it } from "vitest";
import type { VocabWord } from "@/entities/vocab/api/vocab";
import {
  getVocabWordFormError,
  toCreateVocabWordInput,
  toUpdateVocabWordInput,
  toVocabWordFormValues,
  type VocabWordFormValues,
} from "./vocabWordForm";

function makeValues(
  overrides: Partial<VocabWordFormValues> = {},
): VocabWordFormValues {
  return {
    word: "example",
    type: "",
    ipa: "",
    meaningVi: "",
    ...overrides,
  };
}

function makeWord(overrides: Partial<VocabWord> = {}): VocabWord {
  return {
    id: "word-id",
    userId: "user-id",
    word: "example",
    normalizedWord: "example",
    definitions: [],
    ...overrides,
  };
}

function makeDefinition(overrides = {}) {
  return {
    id: "definition-id",
    vocabWordId: "word-id",
    sourceDefinitionId: null,
    sourceWordId: null,
    type: null,
    meaningVi: null,
    definition: null,
    example: null,
    exampleVi: null,
    ipaUk: null,
    ipaUs: null,
    band: null,
    source: "manual",
    level: 0,
    wrongCount: 0,
    lastReview: null,
    nextReview: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

describe("getVocabWordFormError", () => {
  it("requires word", () => {
    expect(getVocabWordFormError(makeValues({ word: "   " }))).toBe(
      "Word is required.",
    );
  });

  it("validates maximum field lengths after trimming", () => {
    expect(
      getVocabWordFormError(makeValues({ word: ` ${"a".repeat(121)} ` })),
    ).toBe("Word must be at most 120 characters.");

    expect(
      getVocabWordFormError(makeValues({ ipa: ` ${"a".repeat(121)} ` })),
    ).toBe("IPA must be at most 120 characters.");

    expect(
      getVocabWordFormError(makeValues({ type: ` ${"a".repeat(81)} ` })),
    ).toBe("Type must be at most 80 characters.");

    expect(
      getVocabWordFormError(makeValues({ meaningVi: ` ${"a".repeat(501)} ` })),
    ).toBe("Vietnamese meaning must be at most 500 characters.");
  });

  it("accepts valid values", () => {
    expect(
      getVocabWordFormError(
        makeValues({
          word: " example ",
          ipa: " /ɪɡˈzæmpəl/ ",
          type: " noun ",
          meaningVi: " ví dụ ",
        }),
      ),
    ).toBeNull();
  });
});

describe("vocab word form mappers", () => {
  it("trims create input and omits blank optional fields", () => {
    expect(
      toCreateVocabWordInput(
        makeValues({
          word: " example ",
          ipa: " ",
          type: " noun ",
          meaningVi: "",
        }),
      ),
    ).toEqual({
      word: "example",
      ipa: undefined,
      type: "noun",
      meaningVi: undefined,
    });
  });

  it("uses the same mapping for update input", () => {
    expect(
      toUpdateVocabWordInput(
        makeValues({
          word: " edited ",
          ipa: " /e/ ",
          type: "",
          meaningVi: " sửa ",
        }),
      ),
    ).toEqual({
      word: "edited",
      ipa: "/e/",
      type: undefined,
      meaningVi: "sửa",
    });
  });

  it("maps nullable API word fields to editable form values", () => {
    expect(
      toVocabWordFormValues(
        makeWord({
          word: "sample",
          definitions: [
            makeDefinition({
              ipaUk: null,
              type: "noun",
              meaningVi: null,
            }),
          ],
        }),
      ),
    ).toEqual({
      word: "sample",
      ipa: "",
      type: "noun",
      meaningVi: "",
    });
  });
});
