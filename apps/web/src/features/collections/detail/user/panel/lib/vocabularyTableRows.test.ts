import { describe, expect, it } from "vitest";
import type { VocabWord } from "@/entities/vocab/api/vocab";
import { expandWordsToDefinitionRows } from "./vocabularyTableRows";

function word(id: string): VocabWord {
  const entry = {
    id,
    userId: "user-id",
    collectionId: "collection-id",
    systemEntryId: null,
    word: id,
    normalizedWord: id,
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
  };

  return { id, userId: entry.userId, word: entry.word, normalizedWord: entry.normalizedWord, definitions: [entry] };
}

describe("expandWordsToDefinitionRows", () => {
  it("returns one row for every flat vocabulary entry", () => {
    const rows = expandWordsToDefinitionRows([word("entry-a"), word("entry-b")]);

    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.definition?.id)).toEqual(["entry-a", "entry-b"]);
    expect(rows.every((row) => row.isFirstInWord && row.isLastInWord)).toBe(true);
  });
});
