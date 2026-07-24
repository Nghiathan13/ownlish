import type { MessageKey } from "@/shared/i18n/messages";

export const CATALOG_TOGGLEABLE_COLUMNS = [
  { id: "ipaUk", labelKey: "wordsTable.ipaUk" },
  { id: "ipaUs", labelKey: "wordsTable.ipaUs" },
  { id: "type", labelKey: "wordsTable.type" },
  { id: "band", labelKey: "wordsTable.band" },
  { id: "meaning", labelKey: "wordsTable.meaning" },
  { id: "example", labelKey: "wordsTable.example" },
] as const satisfies ReadonlyArray<{
  id: string;
  labelKey: MessageKey;
}>;

export type CatalogToggleableColumnId =
  (typeof CATALOG_TOGGLEABLE_COLUMNS)[number]["id"];

export type CatalogColumnVisibility = Record<CatalogToggleableColumnId, boolean>;

export const CATALOG_COLUMN_VISIBILITY_STORAGE_KEY =
  "engvocab:catalog-table-columns";
