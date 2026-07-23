export const CATALOG_TOGGLEABLE_COLUMNS = [
  { id: "ipaUk", label: "IPA UK" },
  { id: "ipaUs", label: "IPA US" },
  { id: "type", label: "Type" },
  { id: "band", label: "Band" },
  { id: "meaning", label: "Meaning" },
  { id: "example", label: "Example" },
] as const;

export type CatalogToggleableColumnId =
  (typeof CATALOG_TOGGLEABLE_COLUMNS)[number]["id"];

export type CatalogColumnVisibility = Record<CatalogToggleableColumnId, boolean>;

export const CATALOG_COLUMN_VISIBILITY_STORAGE_KEY =
  "engvocab:catalog-table-columns";
