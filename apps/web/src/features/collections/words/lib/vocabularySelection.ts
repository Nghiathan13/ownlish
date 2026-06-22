import type { VocabWord, VocabWordDefinition } from "@/entities/vocab/api/vocab";
import { expandWordsToDefinitionRows } from "./vocabularyTableRows";

export type VocabularyDefinitionSelection = {
  word: VocabWord;
  definition: VocabWordDefinition;
};

export function getSelectableDefinitions(
  words: VocabWord[],
): VocabularyDefinitionSelection[] {
  return expandWordsToDefinitionRows(words).flatMap((row) => {
    if (!row.definition) {
      return [];
    }

    return [{ word: row.word, definition: row.definition }];
  });
}

export function getSelectedDefinitions(
  words: VocabWord[],
  selectedDefinitionIds: ReadonlySet<string>,
): VocabularyDefinitionSelection[] {
  return getSelectableDefinitions(words).filter((item) =>
    selectedDefinitionIds.has(item.definition.id),
  );
}
