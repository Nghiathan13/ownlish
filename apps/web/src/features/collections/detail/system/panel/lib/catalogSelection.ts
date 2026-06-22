import type {
  CatalogDefinition,
  CatalogWord,
} from "@/entities/collection/api/collections";
import { expandCatalogWordsToDefinitionRows } from "@/features/collections/detail/system/panel/lib/catalogTableRows";

export type CatalogDefinitionSelection = {
  word: CatalogWord;
  definition: CatalogDefinition;
};

export function getSelectableCatalogDefinitions(
  words: CatalogWord[],
): CatalogDefinitionSelection[] {
  return expandCatalogWordsToDefinitionRows(words).flatMap((row) => {
    if (!row.definition) {
      return [];
    }

    return [{ word: row.word, definition: row.definition }];
  });
}

export function getSelectedCatalogDefinitions(
  words: CatalogWord[],
  selectedDefinitionIds: ReadonlySet<string>,
): CatalogDefinitionSelection[] {
  return getSelectableCatalogDefinitions(words).filter((item) =>
    selectedDefinitionIds.has(item.definition.id),
  );
}
