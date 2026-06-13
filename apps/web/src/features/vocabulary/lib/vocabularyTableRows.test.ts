import { describe, expect, it } from "vitest";
import type { VocabWord } from "@/entities/vocab/api/vocab";
import { expandWordsToDefinitionRows } from "./vocabularyTableRows";

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

describe("expandWordsToDefinitionRows", () => {
  it("returns one row when a word has no definitions", () => {
    const rows = expandWordsToDefinitionRows([makeWord()]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      definition: null,
      definitionCount: 1,
      isFirstInWord: true,
      isLastInWord: true,
    });
  });

  it("returns one row per definition and marks first/last flags", () => {
    const rows = expandWordsToDefinitionRows([
      makeWord({
        definitions: [
          makeDefinition({ id: "def-1", type: "verb" }),
          makeDefinition({ id: "def-2", type: "noun" }),
        ],
      }),
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      definition: expect.objectContaining({ id: "def-1" }),
      definitionCount: 2,
      isFirstInWord: true,
      isLastInWord: false,
    });
    expect(rows[1]).toMatchObject({
      definition: expect.objectContaining({ id: "def-2" }),
      definitionCount: 2,
      isFirstInWord: false,
      isLastInWord: true,
    });
  });

  it("marks isLastInWord only on the final row of each word", () => {
    const rows = expandWordsToDefinitionRows([
      makeWord({
        id: "word-a",
        definitions: [makeDefinition({ id: "a-1" })],
      }),
      makeWord({
        id: "word-b",
        definitions: [
          makeDefinition({ id: "b-1" }),
          makeDefinition({ id: "b-2" }),
        ],
      }),
    ]);

    expect(rows.map((row) => row.isLastInWord)).toEqual([true, false, true]);
  });
});
