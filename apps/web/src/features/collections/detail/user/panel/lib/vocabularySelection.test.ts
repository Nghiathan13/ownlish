import { describe, expect, it } from "vitest";
import type { VocabWord } from "@/entities/vocab/api/vocab";
import {
  getSelectableDefinitions,
  getSelectedDefinitions,
} from "./vocabularySelection";

function makeWord(
  id: string,
  definitions: Array<{ id: string }>,
): VocabWord {
  return {
    id,
    userId: "user-id",
    word: id,
    normalizedWord: id,
    definitions: definitions.map((definition) => ({
      id: definition.id,
      vocabWordId: id,
      sourceDefinitionId: null,
      sourceWordId: null,
      type: "noun",
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
    })),
  };
}

describe("vocabularySelection", () => {
  it("returns selectable definitions from words on the page", () => {
    const words = [
      makeWord("word-a", [{ id: "def-a1" }, { id: "def-a2" }]),
      makeWord("word-b", [{ id: "def-b1" }]),
    ];

    expect(getSelectableDefinitions(words).map((item) => item.definition.id)).toEqual(
      ["def-a1", "def-a2", "def-b1"],
    );
  });

  it("filters selected definitions by id", () => {
    const words = [makeWord("word-a", [{ id: "def-a1" }, { id: "def-a2" }])];
    const selected = new Set(["def-a2"]);

    expect(getSelectedDefinitions(words, selected)).toEqual([
      {
        word: words[0],
        definition: words[0].definitions[1],
      },
    ]);
  });
});
