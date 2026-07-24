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
import type { MessageKey } from "@/shared/i18n/messages";

type Translate = (key: MessageKey) => string;

export function getVocabularyWordsTableHeadColumns(
  visibility: VocabularyColumnVisibility,
  t: Translate,
): WordsTableHeadColumn[] {
  return VOCABULARY_TOGGLEABLE_COLUMNS.filter((column) =>
    isColumnVisible(visibility, column.id),
  ).map((column) => ({
    id: column.id,
    label: t(column.labelKey),
    widthClass: TABLE_COLUMN_WIDTH[column.id],
  }));
}

export function getCatalogWordsTableHeadColumns(
  visibility: CatalogColumnVisibility,
  t: Translate,
): WordsTableHeadColumn[] {
  return CATALOG_TOGGLEABLE_COLUMNS.filter((column) =>
    isCatalogColumnVisible(visibility, column.id),
  ).map((column) => ({
    id: column.id,
    label: t(column.labelKey),
    widthClass: TABLE_COLUMN_WIDTH[column.id],
  }));
}
