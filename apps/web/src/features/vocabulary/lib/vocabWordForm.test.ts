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
      getVocabWordFormError(makeValues({ ipaUk: ` ${"a".repeat(121)} ` })),
    ).toBe("IPA UK must be at most 120 characters.");

    expect(
      getVocabWordFormError(makeValues({ definition: ` ${"a".repeat(1001)} ` })),
    ).toBe("Definition must be at most 1000 characters.");
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
  it("trims create input and omits blank optional fields", () => {
    expect(
      toCreateVocabWordInput(
        makeValues({
          word: " example ",
          ipaUk: " ",
          ipaUs: "/us/",
          type: " noun ",
          meaningVi: "",
          definition: " sample ",
          example: "",
          exampleVi: " vi du ",
          band: " A1 ",
        }),
      ),
    ).toEqual({
      word: "example",
      ipaUk: undefined,
      ipaUs: "/us/",
      type: "noun",
      meaningVi: undefined,
      definition: "sample",
      example: undefined,
      exampleVi: "vi du",
      band: "A1",
    });
  });

  it("includes definitionId in update input", () => {
    expect(
      toUpdateVocabWordInput(
        makeValues({
          word: " edited ",
          ipaUk: " /uk/ ",
          ipaUs: " /us/ ",
          type: "",
          meaningVi: " sửa ",
          exampleVi: " vi du sua ",
        }),
        "definition-id",
      ),
    ).toEqual({
      word: "edited",
      ipaUk: "/uk/",
      ipaUs: "/us/",
      type: undefined,
      meaningVi: "sửa",
      definition: undefined,
      example: undefined,
      exampleVi: "vi du sua",
      band: undefined,
      definitionId: "definition-id",
    });
  });

  it("maps the selected definition to editable form values", () => {
    expect(
      toVocabWordFormValues(
        makeWord({
          word: "sample",
          definitions: [makeDefinition({ id: "definition-id" })],
        }),
        "definition-id",
      ),
    ).toEqual({
      word: "sample",
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
