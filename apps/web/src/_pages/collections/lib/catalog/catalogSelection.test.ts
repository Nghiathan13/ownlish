import { describe, expect, it } from "vitest";
import type { CatalogWord } from "@/entities/collection";
import {
  getSelectableCatalogDefinitions,
  getSelectedCatalogDefinitions,
} from "./catalogSelection";
import { expandCatalogWordsToDefinitionRows } from "./catalogTableRows";

const words: CatalogWord[] = [
  {
    id: "word-1",
    word: "study",
    normalizedWord: "study",
    definitions: [
      {
        id: "definition-1",
        type: "noun",
        meaningVi: "việc học",
        definition: "the activity of learning",
        example: null,
        exampleVi: null,
        ipaUk: null,
        ipaUs: null,
        band: "A1",
        source: "oxford",
      },
      {
        id: "definition-2",
        type: "verb",
        meaningVi: "học",
        definition: "to learn about a subject",
        example: null,
        exampleVi: null,
        ipaUk: null,
        ipaUs: null,
        band: "A1",
        source: "oxford",
      },
    ],
  },
  { id: "word-2", word: "empty", normalizedWord: "empty", definitions: [] },
];

describe("catalog definition rows and selection", () => {
  it("expands every definition while retaining empty catalog words", () => {
    const rows = expandCatalogWordsToDefinitionRows(words);

    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ definitionIndex: 0, definitionCount: 2, isFirstInWord: true, isLastInWord: false });
    expect(rows[1]).toMatchObject({ definitionIndex: 1, definitionCount: 2, isFirstInWord: false, isLastInWord: true });
    expect(rows[2]).toMatchObject({ word: words[1], definition: null, isFirstInWord: true, isLastInWord: true });
  });

  it("only exposes definitions that can actually be imported", () => {
    expect(getSelectableCatalogDefinitions(words).map((item) => item.definition.id)).toEqual([
      "definition-1",
      "definition-2",
    ]);
  });

  it("filters selectable definitions by the current selection", () => {
    expect(
      getSelectedCatalogDefinitions(words, new Set(["definition-2", "missing"])).map(
        (item) => item.definition.id,
      ),
    ).toEqual(["definition-2"]);
  });
});
