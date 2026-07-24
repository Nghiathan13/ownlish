import { describe, expect, it } from "vitest";
import type { VocabWord } from "@/entities/vocab/api/vocab";
import { translate } from "@/shared/i18n/messages";
import {
  formatVocabWordFormError,
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
    ipaUk: "",
    ipaUs: "",
    band: "",
    meaningVi: "",
    definition: "",
    example: "",
    exampleVi: "",
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
    sourceDefinitionId: 42,
    sourceWordId: 7,
    type: "noun",
    meaningVi: "mau",
    definition: "a sample",
    example: "This is an example.",
    exampleVi: "Day la vi du.",
    ipaUk: "/ɪɡˈzɑːmpl/",
    ipaUs: "/ɪɡˈzæmpl/",
    band: "A1",
    source: "oxford_3000",
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

const t = (key: Parameters<typeof translate>[1]) => translate("en", key);

describe("getVocabWordFormError", () => {
  it("requires word", () => {
    const error = getVocabWordFormError(makeValues({ word: "   " }));
    expect(error).toEqual({ code: "wordRequired" });
    expect(formatVocabWordFormError(error!, t)).toBe("Word is required.");
  });

  it("validates maximum field lengths after trimming", () => {
    const wordError = getVocabWordFormError(
      makeValues({ word: ` ${"a".repeat(121)} ` }),
    );
    expect(wordError).toEqual({
      code: "maxLength",
      field: "word",
      limit: 120,
    });
    expect(formatVocabWordFormError(wordError!, t)).toBe(
      "Word must be at most 120 characters.",
    );

    const ipaError = getVocabWordFormError(
      makeValues({ ipaUk: ` ${"a".repeat(121)} ` }),
    );
    expect(formatVocabWordFormError(ipaError!, t)).toBe(
      "IPA UK must be at most 120 characters.",
    );

    const definitionError = getVocabWordFormError(
      makeValues({ definition: ` ${"a".repeat(1001)} ` }),
    );
    expect(formatVocabWordFormError(definitionError!, t)).toBe(
      "Definition must be at most 1000 characters.",
    );
  });

  it("accepts valid values", () => {
    expect(
      getVocabWordFormError(
        makeValues({
          word: " example ",
          ipaUk: " /ɪɡˈzæmpəl/ ",
          type: " noun ",
          meaningVi: " ví dụ ",
        }),
      ),
    ).toBeNull();
  });
});

describe("vocab word form mappers", () => {
  it("maps create input", () => {
    expect(
      toCreateVocabWordInput(
        makeValues({
          word: " example ",
          type: " noun ",
          meaningVi: " ví dụ ",
        }),
      ),
    ).toEqual({
      word: "example",
      type: "noun",
      meaningVi: "ví dụ",
      band: undefined,
      definition: undefined,
      example: undefined,
      exampleVi: undefined,
      ipaUk: undefined,
      ipaUs: undefined,
    });
  });

  it("maps update input and can lock word", () => {
    expect(
      toUpdateVocabWordInput(
        makeValues({ word: " changed ", definition: " updated " }),
        "definition-id",
        { lockWord: true },
      ),
    ).toEqual({
      definitionId: "definition-id",
      definition: "updated",
      band: undefined,
      example: undefined,
      exampleVi: undefined,
      ipaUk: undefined,
      ipaUs: undefined,
      meaningVi: undefined,
      type: undefined,
    });
  });

  it("maps form values from a word definition", () => {
    const word = makeWord({
      definitions: [makeDefinition()],
    });

    expect(toVocabWordFormValues(word, "definition-id")).toEqual({
      word: "example",
      type: "noun",
      ipaUk: "/ɪɡˈzɑːmpl/",
      ipaUs: "/ɪɡˈzæmpl/",
      band: "A1",
      meaningVi: "mau",
      definition: "a sample",
      example: "This is an example.",
      exampleVi: "Day la vi du.",
    });
  });
});
