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
  return words.map((word) => ({
      word,
      definition: word.definitions[0],
      definitionIndex: 0,
      definitionCount: 1,
      isFirstInWord: true,
      isLastInWord: true,
    }));
}
