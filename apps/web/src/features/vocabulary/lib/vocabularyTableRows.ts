import type { VocabWord, VocabWordDefinition } from "@/entities/vocab/api/vocab";

export type VocabularyDefinitionRow = {
  word: VocabWord;
  definition: VocabWordDefinition | null;
  definitionIndex: number;
  definitionCount: number;
  isFirstInWord: boolean;
  isLastInWord: boolean;
};

export function expandWordsToDefinitionRows(
  words: VocabWord[],
): VocabularyDefinitionRow[] {
  return words.flatMap((word) => {
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
