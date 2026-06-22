import type {
  CatalogDefinition,
  CatalogWord,
} from "@/entities/collection/api/collections";

export type CatalogDefinitionRow = {
  word: CatalogWord;
  definition: CatalogDefinition | null;
  definitionIndex: number;
  definitionCount: number;
  isFirstInWord: boolean;
  isLastInWord: boolean;
};

export function expandCatalogWordsToDefinitionRows(
  words: CatalogWord[],
): CatalogDefinitionRow[] {
  return words.flatMap((word): CatalogDefinitionRow[] => {
    const definitions = word.definitions;
    const definitionCount = definitions.length > 0 ? definitions.length : 1;

    if (definitions.length === 0) {
      return [
        {
          word,
          definition: null,
          definitionIndex: 0,
          definitionCount: 1,
          isFirstInWord: true,
          isLastInWord: true,
        },
      ];
    }

    return definitions.map((definition, definitionIndex) => ({
      word,
      definition,
      definitionIndex,
      definitionCount,
      isFirstInWord: definitionIndex === 0,
      isLastInWord: definitionIndex === definitions.length - 1,
    }));
  });
}
