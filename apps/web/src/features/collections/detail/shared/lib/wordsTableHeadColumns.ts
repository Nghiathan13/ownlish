import { CATALOG_TOGGLEABLE_COLUMNS } from "@/features/collections/detail/system/panel/constants/catalogTableColumns";
import {
  isCatalogColumnVisible,
  type CatalogColumnVisibility,
} from "@/features/collections/detail/system/panel/lib/catalogTableColumns";
import { VOCABULARY_TOGGLEABLE_COLUMNS } from "@/features/collections/detail/user/panel/constants/vocabularyTableColumns";
import {
  isColumnVisible,
  type VocabularyColumnVisibility,
} from "@/features/collections/detail/user/panel/lib/vocabularyTableColumns";
import { TABLE_COLUMN_WIDTH } from "@/features/collections/detail/shared/constants/columnWidths";
import type { WordsTableHeadColumn } from "@/features/collections/detail/shared/components/WordsTableHead";

export function getVocabularyWordsTableHeadColumns(
  visibility: VocabularyColumnVisibility,
): WordsTableHeadColumn[] {
  return VOCABULARY_TOGGLEABLE_COLUMNS.filter((column) =>
    isColumnVisible(visibility, column.id),
  ).map((column) => ({
    label: column.label,
    widthClass: TABLE_COLUMN_WIDTH[column.id],
  }));
}

export function getCatalogWordsTableHeadColumns(
  visibility: CatalogColumnVisibility,
): WordsTableHeadColumn[] {
  return CATALOG_TOGGLEABLE_COLUMNS.filter((column) =>
    isCatalogColumnVisible(visibility, column.id),
  ).map((column) => ({
    label: column.label,
    widthClass: TABLE_COLUMN_WIDTH[column.id],
  }));
}
